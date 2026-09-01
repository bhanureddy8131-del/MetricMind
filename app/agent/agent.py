"""
LLM Agent
Orchestrates the LLM-powered query interpretation using LangChain.
Translates natural language questions into structured queries.
"""
import json
import logging
import os
from typing import Dict, Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    COHERE = "cohere"


class QueryAgent:
    """
    Main agent for processing natural language queries.
    Coordinates with the LLM to extract metrics, dimensions, and generate SQL.
    """

    def __init__(self):
        self.llm_provider = os.getenv("LLM_PROVIDER", "openai").lower()
        self.llm = self._initialize_llm()
        from app.agent.tools import AgentTools
        self.tools = AgentTools()

    def _initialize_llm(self):
        """Initialize the LLM based on configured provider."""
        try:
            if self.llm_provider == "openai":
                from langchain_openai import ChatOpenAI

                api_key = os.getenv("OPENAI_API_KEY")
                if not api_key:
                    logger.warning("OPENAI_API_KEY not set - LLM features may not work")
                    return None

                model = os.getenv("OPENAI_MODEL", "gpt-4")
                return ChatOpenAI(
                    api_key=api_key,
                    model=model,
                    temperature=0.2,  # Low temperature for consistent results
                )

            elif self.llm_provider == "anthropic":
                try:
                    from langchain_anthropic import ChatAnthropic

                    api_key = os.getenv("ANTHROPIC_API_KEY")
                    if not api_key:
                        logger.warning("ANTHROPIC_API_KEY not set")
                        return None

                    return ChatAnthropic(
                        api_key=api_key,
                        model="claude-3-sonnet-20240229",
                        temperature=0.2,
                    )
                except ImportError:
                    logger.error("langchain-anthropic not installed")
                    return None

            elif self.llm_provider == "cohere":
                try:
                    from langchain_cohere import ChatCohere

                    api_key = os.getenv("COHERE_API_KEY")
                    if not api_key:
                        logger.warning("COHERE_API_KEY not set")
                        return None

                    return ChatCohere(
                        api_key=api_key,
                        temperature=0.2,
                    )
                except ImportError:
                    logger.error("langchain-cohere not installed")
                    return None

            else:
                logger.error(f"Unknown LLM provider: {self.llm_provider}")
                return None

        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            return None

    def parse_question(self, question: str) -> Dict[str, Any]:
        """
        Parse a natural language question and extract query components.

        Args:
            question: Natural language business question

        Returns:
            Dictionary with:
            - metrics: list of metric names
            - dimensions: list of dimension names
            - filters: dict of filters
            - error: error message if parsing failed
        """
        if not self.llm:
            return self._fallback_parse(question)

        try:
            from langchain.prompts import PromptTemplate
            from langchain.chains import LLMChain
            from app.agent.prompts import QUERY_EXTRACTION_PROMPT, format_metrics_for_prompt, format_dimensions_for_prompt
            from app.semantic_layer.loader import semantic_layer

            # Get semantic layer info
            metrics_list = format_metrics_for_prompt(semantic_layer.list_metrics())
            dimensions_list = format_dimensions_for_prompt(semantic_layer.list_dimensions())

            # Create prompt template
            prompt = PromptTemplate(
                input_variables=["question", "metrics_list", "dimensions_list"],
                template=QUERY_EXTRACTION_PROMPT,
            )

            # Create chain
            chain = LLMChain(llm=self.llm, prompt=prompt)

            # Run chain
            result = chain.run(
                question=question,
                metrics_list=metrics_list,
                dimensions_list=dimensions_list,
            )

            # Parse JSON response
            try:
                parsed = json.loads(result)
                logger.info(f"Parsed query: {parsed}")
                return parsed
            except json.JSONDecodeError:
                logger.error(f"Failed to parse LLM response as JSON: {result}")
                # Try to extract JSON from response
                import re
                json_match = re.search(r"\{.*\}", result, re.DOTALL)
                if json_match:
                    try:
                        parsed = json.loads(json_match.group())
                        return parsed
                    except:
                        pass

            return self._fallback_parse(question)

        except Exception as e:
            logger.error(f"Error parsing question with LLM: {e}")
            return self._fallback_parse(question)

    def _fallback_parse(self, question: str) -> Dict[str, Any]:
        """
        Fallback parsing when LLM is not available.
        Uses simple heuristics to extract metrics and dimensions.
        """
        result = self.tools.extract_query_intent(question)

        return {
            "metrics": result.get("possible_metrics", []),
            "dimensions": result.get("possible_dimensions", []),
            "filters": {},
            "intent": result.get("question", ""),
            "confidence": 0.5,
            "warning": "Using fallback parser - LLM not available",
        }

    def generate_response(self, question: str, results: list, row_count: int, metrics: list, dimensions: list) -> str:
        """
        Generate a natural language response based on query results.

        Args:
            question: Original question
            results: Query results (list of dicts)
            row_count: Number of result rows
            metrics: Metrics used
            dimensions: Dimensions used

        Returns:
            Natural language response
        """
        if not self.llm or not results:
            return self._fallback_response(question, results, metrics)

        try:
            from langchain.prompts import PromptTemplate
            from langchain.chains import LLMChain
            from app.agent.prompts import RESPONSE_GENERATION_PROMPT

            # Format results for prompt
            results_str = json.dumps(results[:10], indent=2)

            prompt = PromptTemplate(
                input_variables=["question", "results", "row_count", "metrics", "dimensions"],
                template=RESPONSE_GENERATION_PROMPT,
            )

            chain = LLMChain(llm=self.llm, prompt=prompt)

            response = chain.run(
                question=question,
                results=results_str,
                row_count=row_count,
                metrics=", ".join(metrics),
                dimensions=", ".join(dimensions),
            )

            return response.strip()

        except Exception as e:
            logger.error(f"Error generating response with LLM: {e}")
            return self._fallback_response(question, results, metrics)

    def _fallback_response(self, question: str, results: list, metrics: list) -> str:
        """Generate a basic response when LLM is not available."""
        if not results:
            return "No results found for your query."

        metric = metrics[0] if metrics else "result"
        result_count = len(results)

        response = f"Based on the analysis: {result_count} records retrieved."
        if result_count > 0 and isinstance(results[0], dict):
            first_row = results[0]
            details = ", ".join([f"{k}: {v}" for k, v in list(first_row.items())[:2]])
            response += f" Top result: {details}."

        return response


# Global agent instance
_agent_instance = None


def get_agent() -> QueryAgent:
    """Get or create the global agent instance."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = QueryAgent()
    return _agent_instance
