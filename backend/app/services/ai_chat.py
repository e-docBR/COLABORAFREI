
import re
from sqlalchemy import select, func, desc, case
from sqlalchemy.orm import Session
from ..models import Aluno, Nota
from ..core.database import SessionLocal
from loguru import logger
from typing import TypedDict, List, Any, Optional

class AIResponse(TypedDict):
    text: str
    type: str # 'text', 'table', 'chart'
    data: Optional[Any]
    chart_config: Optional[Any]

class AIAnalystEngine:
    def __init__(self):
        self.intent_patterns = {
            'chart_grades': [r'gr[áa]fico.*nota', r'comparar.*media', r'desempenho.*turma'],
            'risky_students': [r'risco', r'reprovad', r'nota.*baixa', r'vermelho'],
            'best_students': [r'melhor.*aluno', r'maior.*nota', r'destaque'],
            'count_stats': [r'quantos', r'total', r'contar'],
            'report_faults': [r'faltas', r'frequ[êe]ncia', r'aus[êe]ncias']
        }

    def _extract_filters(self, message: str) -> dict:
        """Extracts filters like Class (Turma) or Discipline from message."""
        filters = {}
        message = message.upper()
        
        # Extract Turma (e.g., "6A", "9 C", "1 ANO")
        # Simple regex for typical class patterns in this context
        turma_match = re.search(r'\b([1-9])\s*([A-Z])\b', message) # 6 A
        if turma_match:
            filters['turma'] = f"{turma_match.group(1)} ANO {turma_match.group(2)}"
        
        # Extract Turno
        if 'MANH' in message: filters['turno'] = 'MANHÃ'
        if 'TARDE' in message: filters['turno'] = 'TARDE'

        return filters

    def process_query(self, message: str) -> AIResponse:
        session = SessionLocal()
        message_lower = message.lower()
        try:
            filters = self._extract_filters(message)
            
            # 1. CHART INTENT: Grade Comparison
            if any(re.search(p, message_lower) for p in self.intent_patterns['chart_grades']):
                return self._generate_grade_chart(session, filters)

            # 2. LIST INTENT: Risky Students
            if any(re.search(p, message_lower) for p in self.intent_patterns['risky_students']):
                return self._analyze_risk(session, filters)

            # 3. STATS INTENT: Counts
            if any(re.search(p, message_lower) for p in self.intent_patterns['count_stats']):
                return self._analyze_stats(session, filters)

            # 4. REPORT INTENT: Faults
            if any(re.search(p, message_lower) for p in self.intent_patterns['report_faults']):
                return self._analyze_faults(session, filters)

            # 5. LIST INTENT: Best Students
            if any(re.search(p, message_lower) for p in self.intent_patterns['best_students']):
                return self._analyze_best_students(session, filters)

            # 6. LIST INTENT: Above/Below Average (generic fallback for 'media')
            if 'acima' in message_lower and 'm[ée]dia' in message_lower:
                 return self._analyze_performance(session, filters, above_avg=True)
            if 'abaixo' in message_lower and 'm[ée]dia' in message_lower:
                 return self._analyze_performance(session, filters, above_avg=False)

            # 7. CHART INTENT: Hardest Subjects
            if any(p in message_lower for p in ['dif[íi]cil', 'complexa', 'pior.*nota', 'disciplina.*baixa']):
                 return self._analyze_hardest_subjects(session, filters)

            # 8. CHART INTENT: Status Distribution
            if any(p in message_lower for p in ['status', 'situa[çc][ãa]o', 'aprovad', 'recupera[çc][ãa]o']):
                 return self._analyze_status_stats(session, filters)

            # Default conversational fallback
            return {
                "text": "Posso ajudar com análises complexas. Tente: 'Gráfico de médias do 6A', 'Quem está em risco na Manhã?', 'Relatório de faltas'.",
                "type": "text",
                "data": None,
                "chart_config": None
            }
        finally:
            session.close()

    def _generate_grade_chart(self, session: Session, filters: dict) -> AIResponse:
        """Generates a dataset for a chart comparing grades."""
        query = select(
            Aluno.turma, 
            func.avg(Nota.total).label('media_geral')
        ).join(Nota).group_by(Aluno.turma)

        if filters.get('turno'):
            query = query.where(Aluno.turno == filters['turno'])
        
        results = session.execute(query).all()
        data = [{"name": r.turma, "value": round(r.media_geral, 1)} for r in results]
        # Sort by value desc
        data.sort(key=lambda x: x['value'], reverse=True)

        return {
            "text": "Aqui está o comparativo de médias entre as turmas solicitadas:",
            "type": "chart",
            "data": data,
            "chart_config": {
                "type": "bar",
                "xKey": "name",
                "yKey": "value",
                "color": "#1976d2",
                "title": "Média Geral por Turma"
            }
        }

    def _analyze_risk(self, session: Session, filters: dict) -> AIResponse:
        """List students at risk."""
        query = select(Aluno.nome, Aluno.turma, func.avg(Nota.total).label('media'))\
            .join(Nota)\
            .group_by(Aluno.id)\
            .having(func.avg(Nota.total) < 60)\
            .order_by("media")\
            .limit(10)
        
        if filters.get('turma'):
            query = query.where(Aluno.turma == filters['turma'])

        results = session.execute(query).all()
        
        if not results:
             return {"text": "Não encontrei alunos em risco crítico com os filtros atuais.", "type": "text", "data": None, "chart_config": None}

        table_data = [{"Aluno": r.nome, "Turma": r.turma, "Média": round(r.media, 1)} for r in results]

        return {
            # Dynamic text generation based on data
            "text": f"Encontrei {len(results)} alunos com desempenho abaixo do esperado (Média < 60). A situação mais crítica é de {results[0].nome}.",
            "type": "table",
            "data": table_data,
            "chart_config": None
        }

    def _analyze_stats(self, session: Session, filters: dict) -> AIResponse:
        count = session.execute(select(func.count(Aluno.id))).scalar_one()
        return {
            "text": f"Nossa base de dados contém {count} alunos ativos matriculados.",
            "type": "text",
            "data": None, 
            "chart_config": None
        }

    def _analyze_faults(self, session: Session, filters: dict) -> AIResponse:
        """Analyze students with high absence count."""
        query = select(Aluno.nome, Aluno.turma, func.sum(Nota.faltas).label('total_faltas'))\
            .join(Nota)\
            .group_by(Aluno.id)\
            .order_by(desc('total_faltas'))\
            .limit(5)

        results = session.execute(query).all()
        data = [{"name": r.nome, "value": r.total_faltas, "extra": r.turma} for r in results]
        
        return {
            "text": "Estes são os 5 alunos com maior índice de infrequência:",
            "type": "chart",
            "data": data,
            "chart_config": {
                "type": "bar",
                "xKey": "name",
                "yKey": "value",
                "color": "#d32f2f",
                "title": "Alunos com Mais Faltas"
            }
        }

    def _analyze_best_students(self, session: Session, filters: dict) -> AIResponse:
        """List top performing students based on total grade average."""
        query = select(Aluno.nome, Aluno.turma, func.avg(Nota.total).label('media'))\
            .join(Nota)\
            .group_by(Aluno.id)\
            .order_by(desc('media'))\
            .limit(5)
        
        if filters.get('turma'):
             query = query.where(Aluno.turma == filters['turma'])

        results = session.execute(query).all()
        data = [{"Aluno": r.nome, "Turma": r.turma, "Média": round(r.media, 1)} for r in results]
        
        return {
            "text": "Aqui estão os alunos com melhor desempenho acadêmico:",
            "type": "table",
            "data": data,
            "chart_config": None
        }

    def _analyze_performance(self, session: Session, filters: dict, above_avg: bool) -> AIResponse:
        """List students above or below global average (60.0 usually, or calculated)."""
        # Calculate global average first or use fixed 60
        threshold = 60.0
        
        op = func.avg(Nota.total) >= threshold if above_avg else func.avg(Nota.total) < threshold
        direction = "acima" if above_avg else "abaixo"

        query = select(Aluno.nome, Aluno.turma, func.avg(Nota.total).label('media'))\
            .join(Nota)\
            .group_by(Aluno.id)\
            .having(op)\
            .order_by(desc('media') if above_avg else 'media')\
            .limit(10)

        if filters.get('turma'):
             query = query.where(Aluno.turma == filters['turma'])

        results = session.execute(query).all()
        
        if not results:
             return {"text": f"Não encontrei alunos {direction} da média ({threshold}) com os filtros atuais.", "type": "text", "data": None, "chart_config": None}

        data = [{"Aluno": r.nome, "Turma": r.turma, "Média": round(r.media, 1)} for r in results]
        
        return {
            "text": f"Lista de alunos com desempenho {direction} da média de {threshold}:",
            "type": "table",
            "data": data,
            "chart_config": None
        }

    def _analyze_hardest_subjects(self, session: Session, filters: dict) -> AIResponse:
        """Identify subjects with lowest average grades."""
        query = select(Nota.disciplina, func.avg(Nota.total).label('media'))\
            .group_by(Nota.disciplina)\
            .order_by('media')\
            .limit(5)
            
        results = session.execute(query).all()
        data = [{"name": r.disciplina, "value": round(r.media, 1)} for r in results]
        
        return {
            "text": "As disciplinas com as menores médias globais são:",
            "type": "chart",
            "data": data,
            "chart_config": {
                "type": "bar",
                "xKey": "name",
                "yKey": "value",
                "color": "#e65100", # Orange/Dark
                "title": "Disciplinas com Menores Médias"
            }
        }

    def _analyze_status_stats(self, session: Session, filters: dict) -> AIResponse:
        """Count students by status (APR, REP, REC, etc)."""
        query = select(Nota.situacao, func.count(Nota.id))\
            .where(Nota.situacao != None)\
            .group_by(Nota.situacao)
            
        results = session.execute(query).all()
        data = [{"name": r.situacao, "value": r[1]} for r in results if r.situacao]
        
        return {
            "text": "Distribuição dos alunos por situação final:",
            "type": "chart",
            "data": data,
            "chart_config": {
                "type": "bar",
                "xKey": "name",
                "yKey": "value",
                "color": "#4caf50",
                "title": "Situação Final dos Alunos"
            }
        }

# Singleton instance
ai_engine = AIAnalystEngine()

def process_chat_message(message: str) -> dict:
    return ai_engine.process_query(message)
