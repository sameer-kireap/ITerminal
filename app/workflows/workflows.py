from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.workflows.activities import (
        compare_companies_activity,
        evaluate_thesis_activity,
        execute_research_step,
        gather_initial_context,
        generate_bull_bear_activity,
        plan_research_steps,
        synthesize_final_report,
    )
    from app.workflows.models import (
        BullBearAnalysis,
        CompanyComparison,
        ResearchInput,
        ResearchReport,
        ThesisEvaluation,
    )


@workflow.defn
class ResearchWorkflow:
    @workflow.run
    async def run(self, input_data: ResearchInput) -> ResearchReport:
        retry_policy = RetryPolicy(
            maximum_attempts=3,
            initial_interval=timedelta(seconds=2),
            backoff_coefficient=2.0,
        )

        # Step 1: Baseline Context Gathering
        baseline_context = await workflow.execute_activity(
            gather_initial_context,
            args=[input_data.tickers],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy,
        )

        # Step 2: Plan Sub-investigations
        plan = await workflow.execute_activity(
            plan_research_steps,
            args=[input_data.topic, baseline_context],
            start_to_close_timeout=timedelta(seconds=20),
            retry_policy=retry_policy,
        )

        # Step 3: Execute tool research steps (bounded to max 5 iterations)
        gathered_evidence = []
        for step in plan.steps[:5]:
            step_res = await workflow.execute_activity(
                execute_research_step,
                args=[step],
                start_to_close_timeout=timedelta(seconds=60),
                retry_policy=retry_policy,
            )
            gathered_evidence.append(step_res)

        # Step 4: Synthesize Final Report
        report = await workflow.execute_activity(
            synthesize_final_report,
            args=[input_data.topic, input_data.tickers, gathered_evidence],
            start_to_close_timeout=timedelta(seconds=90),
            retry_policy=retry_policy,
        )

        return report


@workflow.defn
class BullBearWorkflow:
    @workflow.run
    async def run(self, ticker: str) -> BullBearAnalysis:
        retry_policy = RetryPolicy(maximum_attempts=3, initial_interval=timedelta(seconds=2))
        baseline_context = await workflow.execute_activity(
            gather_initial_context,
            args=[[ticker]],
            start_to_close_timeout=timedelta(seconds=20),
            retry_policy=retry_policy,
        )
        return await workflow.execute_activity(
            generate_bull_bear_activity,
            args=[ticker, baseline_context],
            start_to_close_timeout=timedelta(seconds=60),
            retry_policy=retry_policy,
        )


@workflow.defn
class ThesisWorkflow:
    @workflow.run
    async def run(self, thesis_id: str, ticker: str, thesis_text: str) -> ThesisEvaluation:
        retry_policy = RetryPolicy(maximum_attempts=3, initial_interval=timedelta(seconds=2))
        baseline_context = await workflow.execute_activity(
            gather_initial_context,
            args=[[ticker]],
            start_to_close_timeout=timedelta(seconds=20),
            retry_policy=retry_policy,
        )
        return await workflow.execute_activity(
            evaluate_thesis_activity,
            args=[thesis_id, ticker, thesis_text, baseline_context],
            start_to_close_timeout=timedelta(seconds=60),
            retry_policy=retry_policy,
        )


@workflow.defn
class CompareWorkflow:
    @workflow.run
    async def run(self, ticker_a: str, ticker_b: str) -> CompanyComparison:
        retry_policy = RetryPolicy(maximum_attempts=3, initial_interval=timedelta(seconds=2))
        baseline_context = await workflow.execute_activity(
            gather_initial_context,
            args=[[ticker_a, ticker_b]],
            start_to_close_timeout=timedelta(seconds=20),
            retry_policy=retry_policy,
        )
        return await workflow.execute_activity(
            compare_companies_activity,
            args=[ticker_a, ticker_b, baseline_context],
            start_to_close_timeout=timedelta(seconds=60),
            retry_policy=retry_policy,
        )
