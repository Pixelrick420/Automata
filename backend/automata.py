from typing import List, Set, Dict

OPERATORS = {'*', '+', '.', '(', ')'}

class State:
    def __init__(self, id: int) -> None:
        self.id = id
        self.transitions = dict()  


class Automata:
    def __init__(self, states: List[int], transitions: Dict[int, Dict[str, Set[int]]], 
                 final: int, initial: int = 0, alphabet: Set[str] = {'1', '0'}):
        self.states = []
        self.initialState = initial
        self.alphabet = alphabet
        self.finalState = final
        self.transitions = transitions

        for id in states:
            state = State(id)
            state.transitions = transitions.get(id, {})
            self.states.append(state)


def addConcatenation(regex: str) -> str:
    if not regex:
        return regex
    
    result = []
    
    for i in range(len(regex)):
        char = regex[i]
        result.append(char)
        
        if char == ' ':
            continue
            
        if i < len(regex) - 1:
            next_char = regex[i + 1]
            
            if next_char == ' ':
                continue
                
            should_concatenate = False
            
            if (char not in OPERATORS or char == ')'):
                if next_char not in OPERATORS or next_char == '(':
                    should_concatenate = True
            
            if should_concatenate:
                result.append('.')
    
    return ''.join(result)


def getPrecedence(operator: str) -> int:
    if operator == '*':
        return 3  
    elif operator == '.':
        return 2   
    elif operator == '+':
        return 1  
    else:
        return 0


def convert(regex: str) -> List[str]:
    regex = addConcatenation(regex)

    stack = []
    out = []
    for char in regex:
        if char == ' ':
            continue

        elif char not in OPERATORS:  
            out.append(char)

        elif char == '(':
            stack.append(char)

        elif char == ')':
            while stack and stack[-1] != '(':
                out.append(stack.pop())
            stack.pop()  

        elif char == '*':
            out.append(char)

        else:
            while stack and stack[-1] != '(' and getPrecedence(char) <= getPrecedence(stack[-1]):
                out.append(stack.pop())
            stack.append(char)

    while stack:
        out.append(stack.pop())

    return out



def generate(postfix: List[str], alphabet: Set[str] = {'0', '1'}) -> Automata:
    if not postfix:
        return Automata([0], {0: {}}, 0, 0, alphabet)

    id_counter = [0]

    def newState():
        s = id_counter[0]
        id_counter[0] += 1
        return s

    def merge(*dicts):
        merged = {}
        for idx, d in enumerate(dicts):
            for k, v in d.items():
                if k not in merged:
                    merged[k] = {}
                for sym, targets in v.items():
                    merged[k].setdefault(sym, set()).update(targets)
        return merged

    stack = []

    for i, token in enumerate(postfix):
        if token not in OPERATORS:
            start, end = newState(), newState()
            transitions = {start: {token: {end}}, end: {}}
            stack.append((start, end, [start, end], transitions))

        elif token == '.':
            right = stack.pop()
            left = stack.pop()

            startA, endA, statesA, transitionsA = right
            startB, endB, statesB, transitionsB = left

            transitionsB.setdefault(endB, {}).setdefault('', set()).add(startA)
            transitions = merge(transitionsB, transitionsA)

            combined_states = statesB + statesA
            stack.append((startB, endA, combined_states, transitions))

        elif token == '+':
            right = stack.pop()
            left = stack.pop()

            startA, endA, statesA, transitionsA = right
            startB, endB, statesB, transitionsB = left
            start, end = newState(), newState()

            transitions = merge(transitionsA, transitionsB)
            transitions[start] = {'': {startB, startA}}
            transitions.setdefault(endA, {}).setdefault('', set()).add(end)
            transitions.setdefault(endB, {}).setdefault('', set()).add(end)
            transitions.setdefault(end, {})

            stack.append((start, end, [start, end] + statesA + statesB, transitions))

        elif token == '*':
            startA, endA, statesA, transitionsA = stack.pop()
            start, end = newState(), newState()

            transitions = merge(transitionsA)
            transitions[start] = {'': {startA, end}}
            transitions.setdefault(endA, {}).setdefault('', set()).update({startA, end})
            transitions.setdefault(end, {})
            
            stack.append((start, end, [start, end] + statesA, transitions))

    while len(stack) > 1:
        right = stack.pop()
        left = stack.pop()
        startA, endA, statesA, transitionsA = right
        startB, endB, statesB, transitionsB = left

        transitionsB.setdefault(endB, {}).setdefault('', set()).add(startA)
        transitions = merge(transitionsB, transitionsA)
        combined_states = statesB + statesA
        stack.append((startB, endA, combined_states, transitions))

    start, end, states, transitions = stack.pop()

    for state in states:
        transitions.setdefault(state, {})

    return Automata(states, transitions, end, start, alphabet)



if __name__ == "__main__":
    test_cases = [
        "10",           
        "10*",          
        "ab",           
        "a(b+c)",       
        "(a+b)c",       
        "a*b",          
        "abc",          
        "1.0*",
        "{{7*       7}}",
        "(2*(2+1)*)**"
    ]
    
    for regex in test_cases:
        print(f"\nOriginal regex: '{regex}'")
        with_concat = addConcatenation(regex)
        print(f"With concatenation: '{with_concat}'")
        postfix = convert(regex)
        print(f"Postfix: {postfix}")
        
        nfa = generate(postfix)
        print(f"Initial: {nfa.initialState}, Final: {nfa.finalState}")
        print("Transitions:")
        for s in sorted(nfa.transitions.keys()):
            trans = nfa.transitions[s]
            print(f"  {s}: {trans}")