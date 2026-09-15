import os

files = ['test_database.py', 'test_api.py', 'tests/test_watchlist.py', 'tests/test_market_portfolio.py']

for fpath in files:
    if not os.path.exists(fpath): continue
    with open(fpath, 'r') as f:
        content = f.read()

    # Add import
    if 'api.config import settings' not in content:
        content = content.replace('import os', 'import os\nfrom api.config import settings')

    # Replace os.environ
    content = content.replace('os.environ["DATABASE_BACKEND"]', 'settings.DATABASE_BACKEND')
    content = content.replace('os.environ["SUPABASE_URL"]', 'settings.SUPABASE_URL')
    content = content.replace('os.environ["SUPABASE_SECRET_KEY"]', 'settings.SUPABASE_SECRET_KEY')
    content = content.replace('os.environ.pop("DATABASE_BACKEND", None)', 'settings.DATABASE_BACKEND = "sqlite"')
    content = content.replace('os.environ.get("DATABASE_BACKEND")', 'settings.DATABASE_BACKEND')

    with open(fpath, 'w') as f:
        f.write(content)
