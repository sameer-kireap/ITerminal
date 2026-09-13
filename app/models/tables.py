from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

article_entities = Table(
    "article_entities",
    Base.metadata,
    Column(
        "article_id", String(64), ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "company_id", String(64), ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True
    ),
    Column("entity_type", String(32), default="mentioned"),
    Column("confidence", Float, default=1.0),
)

event_articles = Table(
    "event_articles",
    Base.metadata,
    Column("event_id", String(64), ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "article_id", String(64), ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True
    ),
    Column("relationship", String(32), default="primary_source"),
)


class CompanyTable(Base):
    __tablename__ = "companies"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    ticker = Column(String(16), unique=True, index=True, nullable=True)
    cik = Column(String(16), unique=True, index=True, nullable=True)
    sector = Column(String(64), nullable=True)
    aliases = Column(JSON, default=list)
    metadata_json = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    articles = relationship("ArticleTable", secondary=article_entities, back_populates="companies")


class ArticleTable(Base):
    __tablename__ = "articles"

    id = Column(String(64), primary_key=True)
    source = Column(String(64), nullable=False, index=True)
    source_id = Column(String(128), nullable=True)
    url = Column(Text, nullable=True)
    content_hash = Column(String(64), unique=True, nullable=False, index=True)
    title = Column(Text, nullable=False)
    body = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    why_it_matters = Column(Text, nullable=True)
    impact_tags = Column(JSON, default=list)
    event_type = Column(String(32), nullable=False, index=True)
    importance_score = Column(Float, nullable=True)
    source_reliability = Column(String(16), default="medium")
    published_at = Column(DateTime, nullable=True, index=True)
    ingested_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)
    processed_at = Column(DateTime, nullable=True)
    raw_payload = Column(JSON, nullable=True)

    companies = relationship("CompanyTable", secondary=article_entities, back_populates="articles")
    events = relationship("EventTable", secondary=event_articles, back_populates="articles")


class EventTable(Base):
    __tablename__ = "events"

    id = Column(String(64), primary_key=True)
    event_type = Column(String(32), nullable=False, index=True)
    primary_company_id = Column(String(64), ForeignKey("companies.id"), nullable=True, index=True)
    status = Column(String(32), default="detected", index=True)
    importance_score = Column(Float, nullable=True)
    title = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    why_it_matters = Column(Text, nullable=True)
    impact_tags = Column(JSON, default=list)
    first_detected_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)
    last_updated_at = Column(DateTime, default=lambda: datetime.now(UTC))

    articles = relationship("ArticleTable", secondary=event_articles, back_populates="events")


class WatchlistTable(Base):
    __tablename__ = "watchlists"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), default="default_user", index=True)
    ticker = Column(String(16), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class ThesisTable(Base):
    __tablename__ = "theses"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), default="default_user", index=True)
    ticker = Column(String(16), nullable=False, index=True)
    thesis_text = Column(Text, nullable=False)
    status = Column(String(32), default="active", index=True)
    last_evaluation = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC))
