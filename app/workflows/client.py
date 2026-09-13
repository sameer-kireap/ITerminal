import asyncio
import uuid

from app.core.config import get_settings
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
    ThesisEvaluation,
    WorkflowStatus,
)

_tasks_registry: dict[str, WorkflowStatus] = {}


class WorkflowDispatcher:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def start_research_workflow(self, input_data: ResearchInput) -> str:
        workflow_id = f"research-{uuid.uuid4().hex[:12]}"
        _tasks_registry[workflow_id] = WorkflowStatus(
            workflow_id=workflow_id,
            status="RUNNING",
            progress=0.1,
            current_step="Gathering initial context",
        )

        asyncio.create_task(self._execute_research_fallback(workflow_id, input_data))
        return workflow_id

    async def _execute_research_fallback(self, workflow_id: str, input_data: ResearchInput) -> None:
        try:
            # 1. Baseline context
            _tasks_registry[workflow_id].progress = 0.2
            _tasks_registry[workflow_id].current_step = "Gathering company baseline disclosures"
            baseline = await gather_initial_context(input_data.tickers)

            # 2. Plan
            _tasks_registry[workflow_id].progress = 0.4
            _tasks_registry[workflow_id].current_step = "Formulating research plan"
            plan = await plan_research_steps(input_data.topic, baseline)

            # 3. Tool execution loop
            _tasks_registry[workflow_id].progress = 0.6
            _tasks_registry[workflow_id].current_step = "Executing tool investigations"
            gathered = []
            for step in plan.steps[:5]:
                step_res = await execute_research_step(step)
                gathered.append(step_res)

            # 4. Report synthesis
            _tasks_registry[workflow_id].progress = 0.85
            _tasks_registry[workflow_id].current_step = "Synthesizing final research report"
            report = await synthesize_final_report(input_data.topic, input_data.tickers, gathered)
            report.workflow_id = workflow_id

            _tasks_registry[workflow_id].status = "COMPLETED"
            _tasks_registry[workflow_id].progress = 1.0
            _tasks_registry[workflow_id].current_step = "Done"
            _tasks_registry[workflow_id].report = report
        except Exception as exc:
            _tasks_registry[workflow_id].status = "FAILED"
            _tasks_registry[workflow_id].error = str(exc)

    def get_status(self, workflow_id: str) -> WorkflowStatus | None:
        return _tasks_registry.get(workflow_id)

    async def run_bull_bear(self, ticker: str) -> BullBearAnalysis:
        baseline = await gather_initial_context([ticker])
        return await generate_bull_bear_activity(ticker, baseline)

    async def run_thesis_eval(
        self, thesis_id: str, ticker: str, thesis_text: str
    ) -> ThesisEvaluation:
        baseline = await gather_initial_context([ticker])
        return await evaluate_thesis_activity(thesis_id, ticker, thesis_text, baseline)

    async def run_compare(self, ticker_a: str, ticker_b: str) -> CompanyComparison:
        baseline = await gather_initial_context([ticker_a, ticker_b])
        return await compare_companies_activity(ticker_a, ticker_b, baseline)


_dispatcher: WorkflowDispatcher | None = None


def get_workflow_dispatcher() -> WorkflowDispatcher:
    global _dispatcher
    if _dispatcher is None:
        _dispatcher = WorkflowDispatcher()
    return _dispatcher
