import uuid
from datetime import UTC, datetime

from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables import ThesisTable
from app.workflows.client import get_workflow_dispatcher
from app.workflows.models import ThesisEvaluation


class ThesisEvaluator:
    def __init__(self, db_session: AsyncSession) -> None:
        self.db = db_session
        self.dispatcher = get_workflow_dispatcher()

    async def create_thesis(
        self, ticker: str, thesis_text: str, user_id: str = "default_user"
    ) -> ThesisTable:
        clean_ticker = ticker.strip().upper()
        thesis_id = str(uuid.uuid4())

        row = ThesisTable(
            id=thesis_id,
            user_id=user_id,
            ticker=clean_ticker,
            thesis_text=thesis_text.strip(),
            status="active",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        self.db.add(row)
        await self.db.commit()

        # Run initial evaluation
        evaluation = await self.dispatcher.run_thesis_eval(
            thesis_id=thesis_id, ticker=clean_ticker, thesis_text=thesis_text
        )
        row.last_evaluation = evaluation.model_dump(mode="json")
        await self.db.commit()
        return row

    async def list_theses(
        self, user_id: str = "default_user", ticker: str | None = None
    ) -> list[ThesisTable]:
        stmt = select(ThesisTable).where(ThesisTable.user_id == user_id)
        if ticker:
            stmt = stmt.where(ThesisTable.ticker == ticker.upper())
        stmt = stmt.order_by(desc(ThesisTable.created_at))
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def evaluate_thesis(self, thesis_id: str) -> ThesisEvaluation:
        stmt = select(ThesisTable).where(ThesisTable.id == thesis_id)
        res = await self.db.execute(stmt)
        row = res.scalar_one_or_none()
        if not row:
            raise ValueError(f"Thesis '{thesis_id}' not found")

        evaluation = await self.dispatcher.run_thesis_eval(
            thesis_id=row.id, ticker=row.ticker, thesis_text=row.thesis_text
        )
        row.last_evaluation = evaluation.model_dump(mode="json")
        row.updated_at = datetime.now(UTC)
        await self.db.commit()
        return evaluation

    async def delete_thesis(self, thesis_id: str) -> bool:
        stmt = delete(ThesisTable).where(ThesisTable.id == thesis_id)
        res = await self.db.execute(stmt)
        await self.db.commit()
        return res.rowcount > 0
