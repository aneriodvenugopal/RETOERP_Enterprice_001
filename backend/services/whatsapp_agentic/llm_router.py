"""
LLM Router - Cost-optimized dual-LLM routing for WhatsApp AI
Primary: Gemini 2.5 Flash-Lite (cheapest, fastest)
Fallback: GPT-4o-mini (complex reasoning, emotional intelligence)

Cost estimates (per 1M tokens):
  Gemini 2.5 Flash-Lite: $0.10 input / $0.40 output
  GPT-4o-mini: $0.15 input / $0.60 output
"""

import os
import logging
import time
from typing import Optional, Dict, Any, List
from google import genai
from google.genai import types
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

# Complexity keywords that trigger GPT-4o-mini fallback
COMPLEX_KEYWORDS = [
    "negotiate", "bargain", "discount", "reduce price", "too expensive",
    "compare", "which is better", "confused", "not sure", "problem",
    "complaint", "unhappy", "angry", "frustrated", "disappointed",
    "legal", "registration", "loan", "emi calculation", "tax",
    "vastu", "feng shui", "investment advice", "roi",
]


def classify_complexity(message: str, context: Dict) -> str:
    """
    Classify message complexity to route to appropriate LLM.
    Returns: 'simple' (Gemini) or 'complex' (GPT-4o-mini)
    """
    msg_lower = message.lower()
    questions_asked = context.get("questions_asked", 0)

    # Complex if emotional / negotiation / deep analysis keywords
    if any(kw in msg_lower for kw in COMPLEX_KEYWORDS):
        return "complex"

    # Complex if long messages (likely detailed queries)
    if len(message) > 300:
        return "complex"

    # Complex after 5+ exchanges (deeper conversation)
    if questions_asked >= 5:
        return "complex"

    return "simple"


class LLMRouter:
    """
    Cost-optimized LLM router for WhatsApp real estate AI.
    Routes to Gemini (cheap) or GPT-4o-mini (complex) based on message complexity.
    """

    def __init__(self):
        self.gemini_key = os.environ.get("GEMINI_API_KEY")
        self.openai_key = os.environ.get("OPENAI_API_KEY")

        # Initialize Gemini client
        self._gemini_client = None
        if self.gemini_key:
            self._gemini_client = genai.Client(api_key=self.gemini_key)

        # Initialize OpenAI client
        self._openai_client = None
        if self.openai_key:
            self._openai_client = AsyncOpenAI(api_key=self.openai_key)

        # Cost tracking
        self._request_count = {"gemini": 0, "openai": 0, "errors": 0}

    async def generate(
        self,
        system_prompt: str,
        user_message: str,
        context: Optional[Dict] = None,
        force_model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate AI response with smart routing.

        Args:
            system_prompt: System instructions
            user_message: User's message
            context: Conversation context for complexity classification
            force_model: Force 'gemini' or 'openai'

        Returns: {"text": str, "model": str, "cost_estimate": float, "latency_ms": int}
        """
        ctx = context or {}
        complexity = force_model or classify_complexity(user_message, ctx)
        model_choice = "gemini" if complexity == "simple" else "openai"

        start = time.time()

        # Try primary model, fallback on error
        try:
            if model_choice == "gemini" and self._gemini_client:
                result = await self._call_gemini(system_prompt, user_message)
                self._request_count["gemini"] += 1
            elif self._openai_client:
                result = await self._call_openai(system_prompt, user_message)
                self._request_count["openai"] += 1
            else:
                # No client available, try whatever is available
                if self._gemini_client:
                    result = await self._call_gemini(system_prompt, user_message)
                    model_choice = "gemini"
                    self._request_count["gemini"] += 1
                elif self._openai_client:
                    result = await self._call_openai(system_prompt, user_message)
                    model_choice = "openai"
                    self._request_count["openai"] += 1
                else:
                    raise ValueError("No LLM API keys configured")
        except Exception as e:
            logger.warning(f"Primary model ({model_choice}) failed: {e}, trying fallback...")
            self._request_count["errors"] += 1
            # Fallback
            try:
                if model_choice == "gemini" and self._openai_client:
                    result = await self._call_openai(system_prompt, user_message)
                    model_choice = "openai"
                    self._request_count["openai"] += 1
                elif model_choice == "openai" and self._gemini_client:
                    result = await self._call_gemini(system_prompt, user_message)
                    model_choice = "gemini"
                    self._request_count["gemini"] += 1
                else:
                    raise
            except Exception as fallback_error:
                logger.error(f"Both LLMs failed: {fallback_error}")
                return {
                    "text": "",
                    "model": "none",
                    "error": str(fallback_error),
                    "cost_estimate": 0,
                    "latency_ms": int((time.time() - start) * 1000),
                }

        latency = int((time.time() - start) * 1000)

        # Estimate cost (rough per-request)
        input_tokens = len(system_prompt + user_message) // 4
        output_tokens = len(result) // 4
        if model_choice == "gemini":
            cost = (input_tokens * 0.10 + output_tokens * 0.40) / 1_000_000
        else:
            cost = (input_tokens * 0.15 + output_tokens * 0.60) / 1_000_000

        logger.info(f"LLM [{model_choice}] latency={latency}ms cost~${cost:.6f}")

        return {
            "text": result,
            "model": model_choice,
            "cost_estimate": cost,
            "latency_ms": latency,
        }

    async def _call_gemini(self, system_prompt: str, user_message: str) -> str:
        """Call Gemini 2.5 Flash-Lite"""
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            temperature=0.7,
            max_output_tokens=500,
        )

        response = await self._gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=user_message,
            config=config,
        )
        return response.text or ""

    async def _call_openai(self, system_prompt: str, user_message: str) -> str:
        """Call GPT-4o-mini"""
        response = await self._openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content or ""

    def get_stats(self) -> Dict[str, Any]:
        """Get usage stats"""
        return {
            "gemini_calls": self._request_count["gemini"],
            "openai_calls": self._request_count["openai"],
            "errors": self._request_count["errors"],
            "total": self._request_count["gemini"] + self._request_count["openai"],
        }


# Singleton
llm_router = LLMRouter()
