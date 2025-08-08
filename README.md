# Regex to NFA Converter

A comprehensive web application that converts regular expressions to Nondeterministic Finite Automata (NFA) with real-time visualization. Built with FastAPI backend and Next.js frontend, featuring interactive automata diagrams and Thompson's construction algorithm implementation.

##  Live Demo

- **Frontend**: [https://regex-automata.vercel.app](https://regex-automata.vercel.app)
- **Backend API**: [https://automata-j8vc.onrender.com](https://automata-j8vc.onrender.com)

##  Features

### Core Functionality
- **Regex to NFA Conversion**: Implements Thompson's construction algorithm
- **Interactive Visualization**: Drag-and-drop state positioning with SVG rendering
- **Real-time Processing**: Instant conversion and visualization updates
- **Error Handling**: Comprehensive regex validation and error reporting

### Technical Features
- **RESTful API**: FastAPI backend with automatic OpenAPI documentation
- **Responsive Design**: Optimized for desktop and mobile devices
- **CORS Support**: Cross-origin resource sharing for frontend-backend communication
- **State Management**: Efficient React state handling for complex automata structures

### Supported Regex Operations
- **Basic Characters**: `a`, `b`, `0`, `1`, etc.
- **Concatenation**: Implicit (e.g., `ab`) and explicit (e.g., `a.b`)
- **Union/OR**: `+` operator (e.g., `a+b`)
- **Kleene Star**: `*` operator (e.g., `a*`)
- **Grouping**: Parentheses `()` for precedence control

## Architecture

### Backend (FastAPI)
```
├── main.py                 # FastAPI application and routes
├── automata.py            # Core NFA generation and conversion logic
└── requirements.txt       # Python dependencies
```

### Frontend (Next.js)
```
├── page.js           # Main application component
└── automata.js        # AutomataVisualizer component
└── package.json           # Node.js dependencies
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 13+ | React-based web application |
| Backend | FastAPI | High-performance Python API |
| Deployment | Vercel + Render | Serverless frontend + containerized backend |
| Styling | CSS-in-JS | Component-scoped styling |
| Visualization | SVG + Canvas | Interactive automata rendering |

##  Algorithm Implementation

### Thompson's Construction Algorithm

The application implements Thompson's construction algorithm to convert regular expressions to NFAs:

1. **Regex Preprocessing**:
   ```python
   def addConcatenation(regex: str) -> str
   ```
   - Inserts explicit concatenation operators (`.`) where needed
   - Handles operator precedence and associativity

2. **Infix to Postfix Conversion**:
   ```python
   def convert(regex: str) -> List[str]
   ```
   - Uses Shunting Yard algorithm
   - Operator precedence: `*` (3) > `.` (2) > `+` (1)

3. **NFA Construction**:
   ```python
   def generate(postfix: List[str]) -> Automata
   ```
   - Stack-based evaluation of postfix expression
   - Creates epsilon transitions for non-deterministic behavior

### State Management

```python
class State:
    def __init__(self, id: int) -> None:
        self.id = id
        self.transitions = dict()

class Automata:
    def __init__(self, states, transitions, final, initial, alphabet):
        # NFA representation with states and transition function
```

### Transition Function Structure

```python
transitions = {
    state_id: {
        symbol: {target_state_1, target_state_2, ...},
        '': {epsilon_transition_targets}  # Empty string for ε-transitions
    }
}
```

## API Documentation

### Base URL
```
https://automata-j8vc.onrender.com
```

### Endpoints

#### `POST /automaton`
Convert regex to NFA.

**Request Body:**
```json
{
  "regex": "a(b+c)*"
}
```

**Response:**
```json
{
  "initial": 0,
  "final": 7,
  "states": [0, 1, 2, 3, 4, 5, 6, 7],
  "transitions": {
    "0": {"": [1]},
    "1": {"a": [2]},
    "2": {"": [3, 7]},
    "3": {"": [4, 6]},
    "4": {"b": [5]},
    "5": {"": [3, 7]},
    "6": {"c": [5]},
    "7": {}
  },
  "regex": "a(b+c)*",
  "postfix": ["a", "b", "c", "+", "*", "."]
}
```

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

#### `GET /`
API information and documentation link.

**Response:**
```json
{
  "message": "Regex to NFA Converter API",
  "docs": "/docs"
}
```

#### `GET /docs`
Documentation.

**Response:**
<img width="1505" height="724" alt="image" src="https://github.com/user-attachments/assets/f351606c-d684-423e-b065-9e305ba95870" />


### Error Responses

```json
{
  "detail": "Error processing regex: Invalid regex syntax"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid regex or processing error
- `422`: Empty regex or validation error

## Frontend Components

### AutomataVisualizer

The main visualization component responsible for rendering NFAs:

**Features:**
- Interactive state positioning via drag-and-drop
- SVG-based rendering with smooth animations
- Automatic layout generation for optimal visualization
- Responsive design for various screen sizes

**State Visualization:**
- **Initial State**: Blue border with "start" label
- **Final State**: Green fill with double border
- **Regular States**: Gray circles with state IDs
- **Transitions**: Curved arrows with symbol labels

### Layout Algorithm

```javascript
const layoutStates = (states) => {
  const centerX = 400;
  const centerY = 300;
  const radius = Math.max(150, states.length * 30);
  
  // Circular layout for multiple states
  states.forEach((s, i) => {
    const angle = (2 * Math.PI * i) / states.length;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    positions[s] = { x, y };
  });
}
```

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Pixelrick420/Automata.git
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Run the server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Basic Usage

1. **Enter Regex**: Input a regular expression in the text field
2. **Generate NFA**: Click "Generate NFA" button
3. **Visualize**: View the generated automaton with interactive states
4. **Manipulate**: Drag states to reposition for better visualization

### Regex Syntax

| Operator | Description | Example | Result |
|----------|-------------|---------|---------|
| `a` | Character literal | `a` | Matches 'a' |
| `ab` | Concatenation | `ab` | Matches 'a' followed by 'b' |
| `a+b` | Union (OR) | `a+b` | Matches 'a' or 'b' |
| `a*` | Kleene star | `a*` | Matches zero or more 'a's |
| `()` | Grouping | `(ab)*` | Matches zero or more "ab" sequences |


## Examples

### Example 1: Simple Alternation
**Input**: `a+b`
**Postfix**: `['a', 'b', '+']`
**States**: 4 states with epsilon transitions for non-determinism

### Example 2: Kleene Star
**Input**: `a*`
**Postfix**: `['a', '*']`
**States**: 4 states with epsilon loops for zero-or-more repetition

### Example 3: Complex Expression
**Input**: `(a+b)*c`
**Postfix**: `['a', 'b', '+', '*', 'c', '.']`
**Description**: Zero or more occurrences of 'a' or 'b', followed by 'c'

## Testing

### Backend Tests
```bash
# Run test cases in automata.py
python automata.py
```

### Frontend Testing
```bash
# Run development server and test manually
npm run dev
```

### Test Cases Included
- Empty regex handling
- Single character recognition
- Operator precedence verification
- Complex nested expressions
- Error handling for invalid syntax

## Development

### Code Structure

**Backend Architecture:**
- `main.py`: FastAPI routes and middleware configuration
- `automata.py`: Core algorithm implementation
- Separation of concerns: API logic vs. automata logic

**Frontend Architecture:**
- Component-based React architecture
- Custom hooks for state management
- SVG manipulation for visualization
- CSS-in-JS for styling

### Adding New Features

1. **New Operators**: Extend `OPERATORS` set and add handling in `generate()`
2. **Visualization**: Modify `AutomataVisualizer` component
3. **API Endpoints**: Add routes in `main.py`

## Deployment

### Backend (Render)
1. Push code to GitHub repository
2. Connect Render to repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
1. Push code to GitHub repository
2. Connect Vercel to repository
3. Set build command: `npm run build`
4. Set output directory: `out` (if using static export)

## Performance Considerations

- **Time Complexity**: O(n) for regex-to-postfix conversion, O(n) for NFA generation
- **Space Complexity**: O(n) for state storage, where n is the length of the regex
- **Scalability**: Handles regexes up to reasonable complexity (tested up to 100+ characters)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript
- Add tests for new features
- Update documentation as needed

## Acknowledgments

- Thompson's construction algorithm for NFA generation
- FastAPI framework for high-performance API development
- Next.js for modern React development
- Vercel and Render for reliable hosting solutions

---
