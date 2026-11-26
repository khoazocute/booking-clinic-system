"""Guard for evals that call a paid API (OpenAI). They never run implicitly: the caller must pass
--allow-paid-api, so a habitual `run_eval --router all` or a CI job can't spend the owner's credits."""

PAID_KINDS = {"openai", "hybrid", "llm"}

FLAG_HELP = "explicitly allow calls to the paid OpenAI API (costs money; off by default)"


def require_paid_api_consent(allowed: bool, what: str) -> None:
    if not allowed:
        raise SystemExit(f"{what} calls the paid OpenAI API and is disabled by default. "
                         f"Re-run with --allow-paid-api if you accept the cost.")
