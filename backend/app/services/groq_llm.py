import os
import httpx
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

_http_client = httpx.Client(verify=False)
client = Groq(api_key=GROQ_API_KEY, http_client=_http_client)


def analyze_macro_impact_with_llm(news_items: list, portfolio_context: dict) -> dict:
    news_str = "\n".join(f"- {n}" for n in news_items if n)
    
    # Format the portfolio context so the LLM understands it
    holdings_str = "Portfolio Holdings:\n"
    for stock in portfolio_context.get("stocks", [])[:10]:  # Limit to top 10 for context window
        holdings_str += f"- Stock: {stock['symbol']}, Value: ₹{stock['current_value']}\n"
    for mf in portfolio_context.get("mfs", [])[:10]:
        holdings_str += f"- Mutual Fund: {mf['scheme_name']}, Value: ₹{mf['current_value']}\n"
        
    if not holdings_str.strip():
        holdings_str = "No specific holdings provided. Analyze for a generic diversified Indian portfolio."

    prompt = f"""You are a top-tier Indian financial analyst and wealth manager. 
Analyze these live macro news headlines and predict their impact on the specific portfolio provided.

Latest Macro News:
{news_str}

{holdings_str}

Provide a detailed, accurate prediction of what will happen to this specific portfolio in the coming days. 
Which specific holdings should the user be on alert for? Which news triggers this, and why?

You MUST respond in valid JSON format matching this exact schema:
{{
  "sentiment": "Bullish" | "Bearish" | "Neutral",
  "executive_summary": "2-3 sentences summarizing the overall market condition and its direct implication for this portfolio.",
  "outlook": "1-2 sentences on what to watch out for in the coming days.",
  "alerts": [
    {{
      "asset": "Name of specific stock or fund from the portfolio",
      "impact": "Bullish" | "Bearish" | "Neutral",
      "news_trigger": "The specific news headline causing this",
      "reason": "Detailed explanation of why this asset is impacted by this news."
    }}
  ]
}}
"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a financial analyst specializing in Indian markets. You always output perfectly valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        response_text = completion.choices[0].message.content.strip()
        return json.loads(response_text)
    except Exception as e:
        print(f"Groq API error: {e}")
        return {
            "sentiment": "Neutral",
            "executive_summary": "AI analysis temporarily unavailable. Please check back shortly.",
            "outlook": "Monitoring market conditions...",
            "alerts": []
        }
