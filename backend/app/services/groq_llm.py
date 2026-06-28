import os
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY)

def analyze_macro_impact_with_llm(news_items: list, portfolio_sectors: list) -> str:
    prompt = f"""
    You are an expert financial analyst. I will provide you with a list of recent macro news headlines and a list of sectors represented in a user's portfolio.
    Analyze the potential impact of these news items on the user's portfolio. Keep it concise.
    
    News Headlines:
    {news_items}
    
    Portfolio Sectors:
    {portfolio_sectors}
    
    Provide a short analysis (max 3 sentences) and overall sentiment (Positive, Negative, Neutral).
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a financial analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=150,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API error: {e}")
        return "Analysis unavailable at this time."
