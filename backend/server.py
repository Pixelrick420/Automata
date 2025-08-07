from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Set
from automata import *  
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Regex to NFA Converter", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://regex-automata.vercel.app"],  # frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # allow POST, GET, OPTIONS etc.
    allow_headers=["*"],
)

class RegexRequest(BaseModel):
    regex: str

class NFAResponse(BaseModel):
    initial: int
    final: int
    states: List[int]
    transitions: Dict[str, Dict[str, List[int]]]
    regex: str
    postfix: List[str]

@app.get("/")
def read_root():
    return {"message": "Regex to NFA Converter API", "docs": "/docs"}

@app.post("/automaton", response_model=NFAResponse)
def build_automaton(req: RegexRequest):
    regex = req.regex.strip()
    if not regex:
        raise HTTPException(status_code=422, detail="Regex cannot be empty")
    
    try:
        postfix = convert(regex)
        nfa = generate(postfix)
        
        formatted_transitions = {}
        for state in nfa.states:
            state_id = str(state.id)
            if state.id in nfa.transitions:
                formatted_transitions[state_id] = {
                    symbol: list(targets) 
                    for symbol, targets in nfa.transitions[state.id].items()
                }
            else:
                formatted_transitions[state_id] = {}
        
        return NFAResponse(
            initial=nfa.initialState,
            final=nfa.finalState,
            states=[s.id for s in nfa.states],
            transitions=formatted_transitions,
            regex=regex,
            postfix=postfix
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Error processing regex: {str(e)}"
        )

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)