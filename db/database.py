import os
import json
import logging
import sqlite3
from typing import Optional, List, Dict, Any
from abc import ABC, abstractmethod
from contextlib import contextmanager

logger = logging.getLogger(__name__)

DB_DIR = "data"
DB_PATH = os.path.join(DB_DIR, "research.db")

class PersistenceError(Exception):
    """Raised when a database operation fails."""
    pass

class ItemExistsError(PersistenceError):
    """Raised when attempting to add a duplicate item."""
    pass

class DatabaseBackend(ABC):
    @abstractmethod
    def init_db(self, db_path=None):
        pass

    @abstractmethod
    def create_job(self, job_id: str, company: str, ticker: str, status: str, created_at: str, db_path=None, user_id: str = None):
        pass

    @abstractmethod
    def update_job(self, job_id: str, status: str, result_json: str = None, error: str = None, 
                   completed_at: str = None, started_at: str = None, db_path=None, 
                   canonical_evidence_json: str = None, consistency_json: str = None, 
                   evaluation_json: str = None, timings_json: str = None):
        pass

    @abstractmethod
    def get_job(self, job_id: str, db_path=None, user_id: str = None) -> Optional[dict]:
        pass

    @abstractmethod
    def list_jobs(self, limit: int = 20, status: str = None, db_path=None, user_id: str = None) -> list:
        pass

    @abstractmethod
    def add_watchlist_item(self, id: str, user_id: str, ticker: str, company_name: str, created_at: str, db_path=None):
        pass

    @abstractmethod
    def list_watchlist(self, user_id: str, db_path=None) -> list:
        pass

    @abstractmethod
    def delete_watchlist_item(self, id: str, user_id: str, db_path=None):
        pass

    @abstractmethod
    def add_portfolio_item(self, id: str, user_id: str, ticker: str, company_name: str, quantity: float, average_cost: float, created_at: str, updated_at: str, db_path=None):
        pass

    @abstractmethod
    def update_portfolio_item(self, id: str, user_id: str, quantity: float, average_cost: float, updated_at: str, db_path=None):
        pass

    @abstractmethod
    def list_portfolio(self, user_id: str, db_path=None) -> list:
        pass

    @abstractmethod
    def delete_portfolio_item(self, id: str, user_id: str, db_path=None):
        pass

    @abstractmethod
    def health_check(self) -> bool:
        pass


class SQLiteBackend(DatabaseBackend):
    @contextmanager
    def _get_db_connection(self, db_path=None):
        db_path = db_path or DB_PATH
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        except sqlite3.Error as e:
            logger.error(f"SQLite error: {e}")
            raise PersistenceError(f"SQLite operation failed") from e
        finally:
            conn.close()

    def init_db(self, db_path=None):
        db_path = db_path or DB_PATH
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            
        with self._get_db_connection(db_path) as conn:
            cursor = conn.cursor()
            # Adding newer JSON columns to SQLite table mapping
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS research_jobs (
                    job_id TEXT PRIMARY KEY,
                    company TEXT NOT NULL,
                    ticker TEXT NOT NULL,
                    status TEXT NOT NULL,
                    result_json TEXT,
                    canonical_evidence_json TEXT,
                    consistency_json TEXT,
                    evaluation_json TEXT,
                    timings_json TEXT,
                    error TEXT,
                    created_at TEXT NOT NULL,
                    started_at TEXT,
                    completed_at TEXT,
                    user_id TEXT
                )
            """)
            
            # Check for existing schema that might be missing newer columns
            cursor.execute("PRAGMA table_info(research_jobs)")
            columns = [info[1] for info in cursor.fetchall()]
            
            required_columns = [
                "canonical_evidence_json",
                "consistency_json",
                "evaluation_json",
                "timings_json",
                "started_at",
                "user_id"
            ]
            
            for col in required_columns:
                if col not in columns:
                    cursor.execute(f"ALTER TABLE research_jobs ADD COLUMN {col} TEXT")
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS watchlist (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    ticker TEXT NOT NULL,
                    company_name TEXT,
                    created_at TEXT NOT NULL,
                    UNIQUE(user_id, ticker)
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS portfolio_holdings (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    ticker TEXT NOT NULL,
                    company_name TEXT,
                    quantity REAL NOT NULL,
                    average_cost REAL NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, ticker)
                )
            """)
            
            conn.commit()

    def create_job(self, job_id: str, company: str, ticker: str, status: str, created_at: str, db_path=None, user_id: str = None):
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO research_jobs (job_id, company, ticker, status, created_at, user_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (job_id, company, ticker, status, created_at, user_id))
                conn.commit()
        except Exception as e:
            raise PersistenceError("SQLite create_job failed") from e

    def update_job(self, job_id: str, status: str, result_json: str = None, error: str = None, 
                   completed_at: str = None, started_at: str = None, db_path=None, 
                   canonical_evidence_json: str = None, consistency_json: str = None, 
                   evaluation_json: str = None, timings_json: str = None):
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE research_jobs
                    SET status = ?, 
                        result_json = COALESCE(?, result_json), 
                        canonical_evidence_json = COALESCE(?, canonical_evidence_json),
                        consistency_json = COALESCE(?, consistency_json),
                        evaluation_json = COALESCE(?, evaluation_json),
                        timings_json = COALESCE(?, timings_json),
                        error = COALESCE(?, error), 
                        started_at = COALESCE(?, started_at),
                        completed_at = COALESCE(?, completed_at)
                    WHERE job_id = ?
                """, (status, result_json, canonical_evidence_json, consistency_json, evaluation_json, timings_json, error, started_at, completed_at, job_id))
                conn.commit()
        except Exception as e:
            raise PersistenceError("SQLite update_job failed") from e

    def get_job(self, job_id: str, db_path=None, user_id: str = None) -> Optional[dict]:
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                if user_id:
                    cursor.execute("SELECT * FROM research_jobs WHERE job_id = ? AND user_id = ?", (job_id, user_id))
                else:
                    cursor.execute("SELECT * FROM research_jobs WHERE job_id = ?", (job_id,))
                row = cursor.fetchone()
                if row:
                    return dict(row)
                return None
        except Exception as e:
            raise PersistenceError("SQLite get_job failed") from e

    def list_jobs(self, limit: int = 20, status: str = None, db_path=None, user_id: str = None) -> list:
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                query = "SELECT job_id, company, ticker, status, created_at, started_at, completed_at, user_id FROM research_jobs"
                params = []
                conditions = []
                if status:
                    conditions.append("status = ?")
                    params.append(status)
                if user_id:
                    conditions.append("user_id = ?")
                    params.append(user_id)
                
                if conditions:
                    query += " WHERE " + " AND ".join(conditions)
                    
                query += " ORDER BY created_at DESC LIMIT ?"
                params.append(limit)
                
                cursor.execute(query, tuple(params))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            raise PersistenceError("SQLite list_jobs failed") from e

    def add_watchlist_item(self, id: str, user_id: str, ticker: str, company_name: str, created_at: str, db_path=None):
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO watchlist (id, user_id, ticker, company_name, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (id, user_id, ticker, company_name, created_at))
                conn.commit()
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed" in str(e).lower() or "unique" in str(e).lower():
                raise ItemExistsError(f"Watchlist item already exists for ticker {ticker}") from e
            raise PersistenceError("SQLite add_watchlist_item failed") from e
        except Exception as e:
            raise PersistenceError("SQLite add_watchlist_item failed") from e

    def list_watchlist(self, user_id: str, db_path=None) -> list:
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id, user_id, ticker, company_name, created_at FROM watchlist WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            raise PersistenceError("SQLite list_watchlist failed") from e

    def delete_watchlist_item(self, id: str, user_id: str, db_path=None):
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM watchlist WHERE id = ? AND user_id = ?", (id, user_id))
                conn.commit()
        except Exception as e:
            raise PersistenceError("SQLite delete_watchlist_item failed") from e

    def add_portfolio_item(self, id: str, user_id: str, ticker: str, company_name: str, quantity: float, average_cost: float, created_at: str, updated_at: str, db_path=None):
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO portfolio_holdings (id, user_id, ticker, company_name, quantity, average_cost, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (id, user_id, ticker, company_name, quantity, average_cost, created_at, updated_at))
                conn.commit()
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed" in str(e).lower() or "unique" in str(e).lower():
                raise ItemExistsError(f"Portfolio holding already exists for ticker {ticker}") from e
            raise PersistenceError("SQLite add_portfolio_item failed") from e
        except Exception as e:
            raise PersistenceError("SQLite add_portfolio_item failed") from e

    def update_portfolio_item(self, id: str, user_id: str, quantity: float, average_cost: float, updated_at: str, db_path=None):
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE portfolio_holdings 
                    SET quantity = ?, average_cost = ?, updated_at = ?
                    WHERE id = ? AND user_id = ?
                """, (quantity, average_cost, updated_at, id, user_id))
                conn.commit()
        except Exception as e:
            raise PersistenceError("SQLite update_portfolio_item failed") from e

    def list_portfolio(self, user_id: str, db_path=None) -> list:
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM portfolio_holdings WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            raise PersistenceError("SQLite list_portfolio failed") from e

    def delete_portfolio_item(self, id: str, user_id: str, db_path=None):
        try:
            with self._get_db_connection(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM portfolio_holdings WHERE id = ? AND user_id = ?", (id, user_id))
                conn.commit()
        except Exception as e:
            raise PersistenceError("SQLite delete_portfolio_item failed") from e

    def health_check(self) -> bool:
        try:
            with self._get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                return True
        except Exception as e:
            logger.error(f"SQLite health_check failed: {e}")
            raise PersistenceError("SQLite health_check failed") from e


class SupabaseBackend(DatabaseBackend):
    def __init__(self):
        self._client = None
        self._initialize_client()

    def _initialize_client(self):
        from api.config import settings
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SECRET_KEY
        if not url or not key or "your_supabase_project_url" in url or "your_supabase_secret_key" in key:
            raise RuntimeError("Missing or invalid SUPABASE_URL or SUPABASE_SECRET_KEY for Supabase backend. Please configure credentials.")
        
        try:
            from supabase import create_client
            self._client = create_client(url, key)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise RuntimeError("Failed to initialize Supabase client") from e

    def init_db(self, db_path=None):
        pass # Migrations are handled via supabase CLI

    def create_job(self, job_id: str, company: str, ticker: str, status: str, created_at: str, db_path=None, user_id: str = None):
        data = {
            "job_id": job_id,
            "company": company,
            "ticker": ticker,
            "status": status,
            "created_at": created_at
        }
        if user_id:
            data["user_id"] = user_id

        try:
            self._client.table("research_jobs").insert(data).execute()
        except Exception as e:
            logger.error(f"Supabase write error (create_job)")
            raise PersistenceError("Supabase create_job failed") from e

    def _safe_json_load(self, json_string, field_name):
        if json_string is None:
            return None
        try:
            return json.loads(json_string)
        except json.JSONDecodeError as e:
            logger.error(f"Malformed JSON in field {field_name}")
            raise PersistenceError(f"Malformed JSON in field {field_name}") from e

    def update_job(self, job_id: str, status: str, result_json: str = None, error: str = None, 
                   completed_at: str = None, started_at: str = None, db_path=None, 
                   canonical_evidence_json: str = None, consistency_json: str = None, 
                   evaluation_json: str = None, timings_json: str = None):
        
        updates = {"status": status}
        if error is not None: updates["error"] = error
        if started_at is not None: updates["started_at"] = started_at
        if completed_at is not None: updates["completed_at"] = completed_at
        
        # Parse JSON fields to objects before sending to JSONB
        if result_json is not None: 
            updates["result_json"] = self._safe_json_load(result_json, "result_json")
        if canonical_evidence_json is not None: 
            updates["canonical_evidence_json"] = self._safe_json_load(canonical_evidence_json, "canonical_evidence_json")
        if consistency_json is not None: 
            updates["consistency_json"] = self._safe_json_load(consistency_json, "consistency_json")
        if evaluation_json is not None: 
            updates["evaluation_json"] = self._safe_json_load(evaluation_json, "evaluation_json")
        if timings_json is not None: 
            updates["timings_json"] = self._safe_json_load(timings_json, "timings_json")

        try:
            self._client.table("research_jobs").update(updates).eq("job_id", job_id).execute()
        except Exception as e:
            logger.error(f"Supabase write error (update_job)")
            raise PersistenceError("Supabase update_job failed") from e

    def get_job(self, job_id: str, db_path=None, user_id: str = None) -> Optional[dict]:
        try:
            query = self._client.table("research_jobs").select("*").eq("job_id", job_id)
            if user_id:
                query = query.eq("user_id", user_id)
            response = query.execute()
            if response.data:
                row = response.data[0]
                # Convert dict/lists back to strings for API compatibility
                for key in ["result_json", "canonical_evidence_json", "consistency_json", "evaluation_json", "timings_json"]:
                    if key in row and isinstance(row[key], (dict, list)):
                        row[key] = json.dumps(row[key])
                return row
            return None
        except Exception as e:
            logger.error(f"Supabase read error (get_job)")
            raise PersistenceError("Supabase get_job failed") from e

    def list_jobs(self, limit: int = 20, status: str = None, db_path=None, user_id: str = None) -> list:
        try:
            query = self._client.table("research_jobs").select("job_id, company, ticker, status, created_at, started_at, completed_at, user_id")
            if status:
                query = query.eq("status", status)
            if user_id:
                query = query.eq("user_id", user_id)
            response = query.order("created_at", desc=True).limit(limit).execute()
            return response.data
        except Exception as e:
            logger.error(f"Supabase read error (list_jobs)")
            raise PersistenceError("Supabase list_jobs failed") from e

    def add_watchlist_item(self, id: str, user_id: str, ticker: str, company_name: str, created_at: str, db_path=None):
        data = {
            "id": id,
            "user_id": user_id,
            "ticker": ticker,
            "company_name": company_name,
            "created_at": created_at
        }
        try:
            self._client.table("watchlist").insert(data).execute()
        except Exception as e:
            err_str = str(e).lower()
            if "unique constraint" in err_str or "duplicate key" in err_str:
                raise ItemExistsError(f"Watchlist item already exists for ticker {ticker}") from e
            logger.error(f"Supabase write error (add_watchlist_item)")
            raise PersistenceError("Supabase add_watchlist_item failed") from e

    def list_watchlist(self, user_id: str, db_path=None) -> list:
        try:
            response = self._client.table("watchlist").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            return response.data
        except Exception as e:
            logger.error(f"Supabase read error (list_watchlist)")
            raise PersistenceError("Supabase list_watchlist failed") from e

    def delete_watchlist_item(self, id: str, user_id: str, db_path=None):
        try:
            self._client.table("watchlist").delete().eq("id", id).eq("user_id", user_id).execute()
        except Exception as e:
            logger.error(f"Supabase write error (delete_watchlist_item)")
            raise PersistenceError("Supabase delete_watchlist_item failed") from e

    def add_portfolio_item(self, id: str, user_id: str, ticker: str, company_name: str, quantity: float, average_cost: float, created_at: str, updated_at: str, db_path=None):
        data = {
            "id": id,
            "user_id": user_id,
            "ticker": ticker,
            "company_name": company_name,
            "quantity": quantity,
            "average_cost": average_cost,
            "created_at": created_at,
            "updated_at": updated_at
        }
        try:
            self._client.table("portfolio_holdings").insert(data).execute()
        except Exception as e:
            err_str = str(e).lower()
            if "unique constraint" in err_str or "duplicate key" in err_str:
                raise ItemExistsError(f"Portfolio holding already exists for ticker {ticker}") from e
            logger.error(f"Supabase write error (add_portfolio_item)")
            raise PersistenceError("Supabase add_portfolio_item failed") from e

    def update_portfolio_item(self, id: str, user_id: str, quantity: float, average_cost: float, updated_at: str, db_path=None):
        updates = {
            "quantity": quantity,
            "average_cost": average_cost,
            "updated_at": updated_at
        }
        try:
            self._client.table("portfolio_holdings").update(updates).eq("id", id).eq("user_id", user_id).execute()
        except Exception as e:
            logger.error(f"Supabase write error (update_portfolio_item)")
            raise PersistenceError("Supabase update_portfolio_item failed") from e

    def list_portfolio(self, user_id: str, db_path=None) -> list:
        try:
            response = self._client.table("portfolio_holdings").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            return response.data
        except Exception as e:
            logger.error(f"Supabase read error (list_portfolio)")
            raise PersistenceError("Supabase list_portfolio failed") from e

    def delete_portfolio_item(self, id: str, user_id: str, db_path=None):
        try:
            self._client.table("portfolio_holdings").delete().eq("id", id).eq("user_id", user_id).execute()
        except Exception as e:
            logger.error(f"Supabase write error (delete_portfolio_item)")
            raise PersistenceError("Supabase delete_portfolio_item failed") from e

    def health_check(self) -> bool:
        try:
            # Lightweight query against an existing table without loading user data or mutating records
            self._client.table("research_jobs").select("job_id").limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase health_check failed: {e}")
            raise PersistenceError("Supabase health_check failed") from e


class MockBackend(DatabaseBackend):
    """In-memory dictionary exclusively for explicit testing mode."""
    def __init__(self):
        self._mock_db: Dict[str, dict] = {}
        self._mock_watchlist: Dict[str, dict] = {}
        self._mock_portfolio: Dict[str, dict] = {}
        self._is_healthy: bool = True

    def clear(self):
        self._mock_db.clear()
        self._mock_watchlist.clear()
        self._mock_portfolio.clear()

    def init_db(self, db_path=None):
        pass

    def create_job(self, job_id: str, company: str, ticker: str, status: str, created_at: str, db_path=None, user_id: str = None):
        self._mock_db[job_id] = {
            "job_id": job_id,
            "company": company,
            "ticker": ticker,
            "status": status,
            "created_at": created_at,
            "user_id": user_id
        }

    def update_job(self, job_id: str, status: str, result_json: str = None, error: str = None, 
                   completed_at: str = None, started_at: str = None, db_path=None, 
                   canonical_evidence_json: str = None, consistency_json: str = None, 
                   evaluation_json: str = None, timings_json: str = None):
        if job_id in self._mock_db:
            updates = {"status": status}
            if result_json is not None: updates["result_json"] = result_json
            if canonical_evidence_json is not None: updates["canonical_evidence_json"] = canonical_evidence_json
            if consistency_json is not None: updates["consistency_json"] = consistency_json
            if evaluation_json is not None: updates["evaluation_json"] = evaluation_json
            if timings_json is not None: updates["timings_json"] = timings_json
            if error is not None: updates["error"] = error
            if started_at is not None: updates["started_at"] = started_at
            if completed_at is not None: updates["completed_at"] = completed_at
            self._mock_db[job_id].update(updates)
        else:
            raise PersistenceError(f"Job {job_id} not found in mock db")

    def get_job(self, job_id: str, db_path=None, user_id: str = None) -> Optional[dict]:
        row = self._mock_db.get(job_id)
        if row:
            if user_id and row.get("user_id") != user_id:
                return None
            r = row.copy()
            # In memory, we keep them as they were stored (strings, if passed as strings)
            return r
        return None

    def list_jobs(self, limit: int = 20, status: str = None, db_path=None, user_id: str = None) -> list:
        jobs = list(self._mock_db.values())
        if status:
            jobs = [j for j in jobs if j.get("status") == status]
        if user_id:
            jobs = [j for j in jobs if j.get("user_id") == user_id]
        jobs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        result = []
        for j in jobs[:limit]:
            result.append({
                "job_id": j.get("job_id"),
                "company": j.get("company"),
                "ticker": j.get("ticker"),
                "status": j.get("status"),
                "created_at": j.get("created_at"),
                "started_at": j.get("started_at"),
                "completed_at": j.get("completed_at"),
                "user_id": j.get("user_id")
            })
        return result

    def add_watchlist_item(self, id: str, user_id: str, ticker: str, company_name: str, created_at: str, db_path=None):
        for item in self._mock_watchlist.values():
            if item.get("user_id") == user_id and item.get("ticker") == ticker:
                raise ItemExistsError(f"Watchlist item already exists for ticker {ticker}")
        
        self._mock_watchlist[id] = {
            "id": id,
            "user_id": user_id,
            "ticker": ticker,
            "company_name": company_name,
            "created_at": created_at
        }

    def list_watchlist(self, user_id: str, db_path=None) -> list:
        items = [item.copy() for item in self._mock_watchlist.values() if item.get("user_id") == user_id]
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return items

    def delete_watchlist_item(self, id: str, user_id: str, db_path=None):
        if id in self._mock_watchlist and self._mock_watchlist[id].get("user_id") == user_id:
            del self._mock_watchlist[id]

    def add_portfolio_item(self, id: str, user_id: str, ticker: str, company_name: str, quantity: float, average_cost: float, created_at: str, updated_at: str, db_path=None):
        for item in self._mock_portfolio.values():
            if item.get("user_id") == user_id and item.get("ticker") == ticker:
                raise ItemExistsError(f"Portfolio holding already exists for ticker {ticker}")
        
        self._mock_portfolio[id] = {
            "id": id,
            "user_id": user_id,
            "ticker": ticker,
            "company_name": company_name,
            "quantity": quantity,
            "average_cost": average_cost,
            "created_at": created_at,
            "updated_at": updated_at
        }

    def update_portfolio_item(self, id: str, user_id: str, quantity: float, average_cost: float, updated_at: str, db_path=None):
        if id in self._mock_portfolio and self._mock_portfolio[id].get("user_id") == user_id:
            self._mock_portfolio[id]["quantity"] = quantity
            self._mock_portfolio[id]["average_cost"] = average_cost
            self._mock_portfolio[id]["updated_at"] = updated_at

    def list_portfolio(self, user_id: str, db_path=None) -> list:
        items = [item.copy() for item in self._mock_portfolio.values() if item.get("user_id") == user_id]
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return items

    def delete_portfolio_item(self, id: str, user_id: str, db_path=None):
        if id in self._mock_portfolio and self._mock_portfolio[id].get("user_id") == user_id:
            del self._mock_portfolio[id]

    def health_check(self) -> bool:
        if not self._is_healthy:
            raise PersistenceError("Mock database health check failed")
        return True


# Singleton setup logic
_db_instance: Optional[DatabaseBackend] = None

def get_db() -> DatabaseBackend:
    global _db_instance
    if _db_instance is not None:
        return _db_instance

    from api.config import settings
    backend_type = settings.DATABASE_BACKEND.lower()
    
    if backend_type == "mock":
        _db_instance = MockBackend()
    elif backend_type == "supabase":
        _db_instance = SupabaseBackend()
    else:
        _db_instance = SQLiteBackend()

    return _db_instance

def init_db(db_path=None):
    get_db().init_db(db_path)

def create_job(job_id: str, company: str, ticker: str, status: str, created_at: str, db_path=None, user_id: str = None):
    get_db().create_job(job_id, company, ticker, status, created_at, db_path, user_id)

def validate_job_transition(current_status: str, new_status: str):
    valid_transitions = {
        "queued": ["running"],
        "running": ["completed", "failed"],
        "completed": [],
        "failed": []
    }
    if new_status not in valid_transitions.get(current_status, []):
        raise PersistenceError(f"Invalid state transition from {current_status} to {new_status}")

def update_job(job_id: str, status: str, result_json: str = None, error: str = None, 
               completed_at: str = None, started_at: str = None, db_path=None, 
               canonical_evidence_json: str = None, consistency_json: str = None, 
               evaluation_json: str = None, timings_json: str = None):
    backend = get_db()
    current_job = backend.get_job(job_id, db_path)
    if current_job:
        validate_job_transition(current_job["status"], status)
    
    backend.update_job(job_id, status, result_json, error, completed_at, started_at, db_path, 
                        canonical_evidence_json, consistency_json, evaluation_json, timings_json)

def get_job(job_id: str, db_path=None, user_id: str = None) -> Optional[dict]:
    return get_db().get_job(job_id, db_path, user_id)

def list_jobs(limit: int = 20, status: str = None, db_path=None, user_id: str = None) -> list:
    return get_db().list_jobs(limit, status, db_path, user_id)

def add_watchlist_item(id: str, user_id: str, ticker: str, company_name: str, created_at: str, db_path=None):
    get_db().add_watchlist_item(id, user_id, ticker, company_name, created_at, db_path)

def list_watchlist(user_id: str, db_path=None) -> list:
    return get_db().list_watchlist(user_id, db_path)

def delete_watchlist_item(id: str, user_id: str, db_path=None):
    get_db().delete_watchlist_item(id, user_id, db_path)

def add_portfolio_item(id: str, user_id: str, ticker: str, company_name: str, quantity: float, average_cost: float, created_at: str, updated_at: str, db_path=None):
    get_db().add_portfolio_item(id, user_id, ticker, company_name, quantity, average_cost, created_at, updated_at, db_path)

def update_portfolio_item(id: str, user_id: str, quantity: float, average_cost: float, updated_at: str, db_path=None):
    get_db().update_portfolio_item(id, user_id, quantity, average_cost, updated_at, db_path)

def list_portfolio(user_id: str, db_path=None) -> list:
    return get_db().list_portfolio(user_id, db_path)

def delete_portfolio_item(id: str, user_id: str, db_path=None):
    get_db().delete_portfolio_item(id, user_id, db_path)

def health_check() -> bool:
    return get_db().health_check()

def set_testing_mode(enabled: bool):
    """
    Explicitly force the mock database for tests. 
    This prevents real DB side-effects during unittesting.
    """
    global _db_instance
    if enabled:
        from api.config import settings
        settings.DATABASE_BACKEND = "mock"
        _db_instance = MockBackend()
    else:
        from api.config import settings
        settings.DATABASE_BACKEND = "sqlite"
        _db_instance = None

def clear_mock_db():
    if isinstance(_db_instance, MockBackend):
        _db_instance.clear()
