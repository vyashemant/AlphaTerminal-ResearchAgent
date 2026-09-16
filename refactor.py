import re

with open('services/research_pipeline.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace module-level llm initialization
content = re.sub(
    r'GEMINI_API_KEY = settings\.GEMINI_API_KEY\n\nif not GEMINI_API_KEY:.*?llm = LLM\(\n    model="gemini/gemini-3\.5-flash",\n    api_key=GEMINI_API_KEY,\n    temperature=0\.3\n\)',
    '''def get_llm():
    from api.config import settings
    GEMINI_API_KEY = settings.GEMINI_API_KEY
    
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY not found. "
            "Please add GEMINI_API_KEY to your .env file."
        )
    
    return LLM(
        model="gemini/gemini-3.5-flash",
        api_key=GEMINI_API_KEY,
        temperature=0.3
    )''',
    content,
    flags=re.DOTALL
)

# 2. Refactor financial_analyst and task
content = re.sub(
    r'financial_analyst = Agent\(',
    'def create_financial_analyst(llm):\n    return Agent(',
    content
)

content = re.sub(
    r'financial_analysis_task = Task\(',
    'def create_financial_analysis_task(financial_analyst):\n    return Task(',
    content
)

# 3. Remove module-level market_news_analyst, valuation_analyst, risk_analyst, investment_strategist
# and specialist_team and strategy_team
content = re.sub(r'(# ============================================================\n# 7\. MARKET & NEWS ANALYST\n# ============================================================).*?(?=def prepare_financial_research)', '', content, flags=re.DOTALL)

# 4. Update run_specialists_in_parallel
new_run_spec = '''def run_specialists_in_parallel(base_inputs, research_contexts):
    """
    Run independent specialist agents concurrently after data retrieval.
    The Investment Strategist still runs only after all reports complete.
    """
    llm = get_llm()
    
    financial_analyst = create_financial_analyst(llm)
    financial_analysis_task = create_financial_analysis_task(financial_analyst)
    
    market_news_analyst = create_market_news_analyst(llm)
    market_news_task = create_market_news_task(market_news_analyst)
    
    valuation_analyst = create_valuation_analyst(llm)
    valuation_task = create_valuation_task(valuation_analyst)
    
    risk_analyst = create_risk_analyst(llm)
    risk_analysis_task = create_risk_analysis_task(risk_analyst)

    specialists = [
        (
            "Financial Analyst",
            financial_analyst,
            financial_analysis_task
        ),
        (
            "Market & News Analyst",
            market_news_analyst,
            market_news_task
        ),
        (
            "Valuation Analyst",
            valuation_analyst,
            valuation_task
        ),
        (
            "Risk Analyst",
            risk_analyst,
            risk_analysis_task
        )
    ]'''

content = re.sub(
    r'def run_specialists_in_parallel\(base_inputs, research_contexts\):.*?specialists = \[\n        \(\n            "Financial Analyst",\n            financial_analyst,\n            financial_analysis_task\n        \),\n        \(\n            "Market & News Analyst",\n            market_news_analyst,\n            market_news_task\n        \),\n        \(\n            "Valuation Analyst",\n            valuation_analyst,\n            valuation_task\n        \),\n        \(\n            "Risk Analyst",\n            risk_analyst,\n            risk_analysis_task\n        \)\n    \]',
    new_run_spec,
    content,
    flags=re.DOTALL
)

# 5. Update run_investment_research to use get_llm() and initialize strategy_team
new_strategy_team = '''    llm = get_llm()
    investment_strategist = create_investment_strategist(llm)
    investment_strategy_task = create_investment_strategy_task(investment_strategist)
    
    strategy_team = Crew(
        agents=[
            investment_strategist
        ],
        tasks=[
            investment_strategy_task
        ],
        process=Process.sequential,
        verbose=True
    )

    stage_start = time.perf_counter()
    strategy_result = strategy_team.kickoff('''

content = re.sub(
    r'    stage_start = time\.perf_counter\(\)\n    strategy_result = strategy_team\.kickoff\(',
    new_strategy_team,
    content
)

with open('services/research_pipeline.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
