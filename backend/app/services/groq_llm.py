import os
import httpx
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Use httpx client that skips SSL verification for Groq too
_http_client = httpx.Client(verify=False)
client = Groq(api_key=GROQ_API_KEY, http_client=_http_client)


def analyze_macro_impact_with_llm(news_items: list, portfolio_sectors: list) -> str:
    news_str = "\n".join(f"- {n}" for n in news_items if n)
    sectors_str = ", ".join(portfolio_sectors)

    prompt = f"""You are a concise Indian financial analyst. Based on these macro news headlines:
{news_str}

Analyze the impact on a portfolio exposed to: {sectors_str}.
Give a 2-3 sentence analysis with your outlook. Be specific to the news, not generic."""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a financial analyst specializing in Indian markets."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API error: {e}")
        return "AI analysis temporarily unavailable. Please check back shortly."
