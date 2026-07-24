"""BACI-compatible extraction, validation, transformation, and loading."""

from tradegraph_data_pipeline.pipeline import PipelineResult, run_pipeline
from tradegraph_data_pipeline.streaming import StreamingResult, run_streaming_pipeline

__all__ = ("PipelineResult", "StreamingResult", "run_pipeline", "run_streaming_pipeline")
