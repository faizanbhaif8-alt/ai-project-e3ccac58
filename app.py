"""
AI Project Generator v3.0
Advanced Flask application with multiple AI model support, project management,
and enhanced user experience features.
"""

import os
import json
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
import requests
from openai import OpenAI
import google.generativeai as genai
from anthropic import Anthropic

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')

# Configure server-side session
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
Session(app)

# Constants
SUPPORTED_LANGUAGES = ['python', 'javascript', 'java', 'c++', 'go', 'rust', 'typescript']
PROJECT_TYPES = ['web-app', 'cli-tool', 'api-service', 'data-analysis', 'machine-learning', 'game', 'mobile-app']
AI_MODELS = {
    'deepseek': 'DeepSeek',
    'openai': 'OpenAI GPT-4',
    'claude': 'Claude 3',
    'gemini': 'Google Gemini'
}

@dataclass
class Project:
    """Data class for project information"""
    id: str
    title: str
    description: str
    language: str
    project_type: str
    complexity: str
    generated_code: str
    ai_model: str
    created_at: str
    user_id: Optional[str] = None

@dataclass
class User:
    """Data class for user information"""
    id: str
    username: str
    email: str
    created_at: str

class AIClientManager:
    """Manages connections to different AI providers"""
    
    def __init__(self):
        self.clients = {}
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize all AI clients based on available API keys"""
        try:
            # DeepSeek
            deepseek_api_key = os.environ.get('DEEPSEEK_API_KEY')
            if deepseek_api_key:
                self.clients['deepseek'] = {
                    'client': OpenAI(
                        api_key=deepseek_api_key,
                        base_url="https://api.deepseek.com"
                    ),
                    'model': 'deepseek-chat'
                }
                logger.info("DeepSeek client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize DeepSeek client: {e}")
        
        try:
            # OpenAI
            openai_api_key = os.environ.get('OPENAI_API_KEY')
            if openai_api_key:
                self.clients['openai'] = {
                    'client': OpenAI(api_key=openai_api_key),
                    'model': 'gpt-4-turbo-preview'
                }
                logger.info("OpenAI client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
        
        try:
            # Anthropic Claude
            anthropic_api_key = os.environ.get('ANTHROPIC_API_KEY')
            if anthropic_api_key:
                self.clients['claude'] = {
                    'client': Anthropic(api_key=anthropic_api_key),
                    'model': 'claude-3-opus-20240229'
                }
                logger.info("Claude client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Claude client: {e}")
        
        try:
            # Google Gemini
            gemini_api_key = os.environ.get('GEMINI_API_KEY')
            if gemini_api_key:
                genai.configure(api_key=gemini_api_key)
                self.clients['gemini'] = {
                    'client': genai,
                    'model': 'gemini-pro'
                }
                logger.info("Gemini client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
    
    def get_available_models(self) -> List[str]:
        """Return list of available AI models"""
        return list(self.clients.keys())
    
    def generate_with_model(self, model_name: str, prompt: str, system_prompt: str = None) -> str:
        """
        Generate text using specified AI model
        
        Args:
            model_name: Name of the AI model to use
            prompt: User prompt
            system_prompt: Optional system prompt
            
        Returns:
            Generated text response
        """
        if model_name not in self.clients:
            raise ValueError(f"Model {model_name} not available")
        
        client_info = self.clients[model_name]
        
        try:
            if model_name == 'deepseek' or model_name == 'openai':
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                response = client_info['client'].chat.completions.create(
                    model=client_info['model'],
                    messages=messages,
                    temperature=0.7,
                    max_tokens=4000
                )
                return response.choices[0].message.content
                
            elif model_name == 'claude':
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                response = client_info['client'].messages.create(
                    model=client_info['model'],
                    max_tokens=4000,
                    temperature=0.7,
                    messages=messages
                )
                return response.content[0].text
                
            elif model_name == 'gemini':
                model = client_info['client'].GenerativeModel(client_info['model'])
                full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                response = model.generate_content(full_prompt)
                return response.text
                
        except Exception as e:
            logger.error(f"Error generating with {model_name}: {e}")
            raise

class ProjectManager:
    """Manages project storage and retrieval"""
    
    def __init__(self, storage_file='projects.json'):
        self.storage_file = storage_file
        self.projects = self._load_projects()
    
    def _load_projects(self) -> Dict[str, Project]:
        """Load projects from storage file"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    projects = {}
                    for project_id, project_data in data.items():
                        projects[project_id] = Project(**project_data)
                    return projects
        except Exception as e:
            logger.error(f"Error loading projects: {e}")
        return {}
    
    def _save_projects(self):
        """Save projects to storage file"""
        try:
            with open(self.storage_file, 'w') as f:
                data = {pid: asdict(project) for pid, project in self.projects.items()}
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving projects: {e}")
    
    def create_project(self, project_data: Dict[str, Any]) -> Project:
        """Create a new project"""
        project_id = f"proj_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.projects)}"
        
        project = Project(
            id=project_id,
            title=project_data['title'],
            description=project_data['description'],
            language=project_data['language'],
            project_type=project_data['project_type'],
            complexity=project_data['complexity'],
            generated_code='',
            ai_model=project_data.get('ai_model', 'deepseek'),
            created_at=datetime.now().isoformat(),
            user_id=session.get('user_id') if 'user_id' in session else None
        )
        
        self.projects[project_id] = project
        self._save_projects()
        logger.info(f"Created project: {project_id}")
        return project
    
    def update_project_code(self, project_id: str, code: str):
        """Update project with generated code"""
        if project_id in self.projects:
            self.projects[project_id].generated_code = code
            self._save_projects()
    
    def get_project(self, project_id: str) -> Optional[Project]:
        """Get project by ID"""
        return self.projects.get(project_id)
    
    def get_user_projects(self, user_id: str) -> List[Project]:
        """Get all projects for a specific user"""
        return [project for project in self.projects.values() if project.user_id == user_id]
    
    def get_all_projects(self) -> List[Project]:
        """Get all projects"""
        return list(self.projects.values())
    
    def delete_project(self, project_id: str) -> bool:
        """Delete a project"""
        if project_id in self.projects:
            del self.projects[project_id]
            self._save_projects()
            logger.info(f"Deleted project: {project_id}")
            return True
        return False

class CodeGenerator:
    """Handles code generation logic"""
    
    def __init__(self, ai_client_manager: AIClientManager):
        self.ai_client = ai_client_manager
    
    def generate_project_code(self, project: Project) -> str:
        """
        Generate code for a project using AI
        
        Args:
            project: Project object containing project details
            
        Returns:
            Generated code as string
        """
        # Create system prompt based on project requirements
        system_prompt = self._create_system_prompt(project)
        
        # Create user prompt
        user_prompt = self._create_user_prompt(project)
        
        try:
            # Generate code using selected AI model
            generated_code = self.ai_client.generate_with_model(
                project.ai_model,
                user_prompt,
                system_prompt
            )
            
            # Clean up and format the code
            cleaned_code = self._clean_generated_code(generated_code)
            
            return cleaned_code
            
        except Exception as e:
            logger.error(f"Error generating code: {e}")
            raise
    
    def _create_system_prompt(self, project: Project) -> str:
        """Create system prompt for AI"""
        return f"""You are an expert software engineer specializing in {project.language} development.
        Your task is to generate complete, production-ready code for the specified project.
        
        Requirements:
        1. Generate COMPLETE, runnable code
        2. Include all necessary imports and dependencies
        3. Add helpful comments explaining key parts
        4. Ensure the code follows best practices for {project.language}
        5. Include error handling and input validation
        6. Make the code modular and maintainable
        7. For {project.project_type} type projects, include appropriate structure
        
        The code should be ready to run with minimal setup."""
    
    def _create_user_prompt(self, project: Project) -> str:
        """Create user prompt for AI"""
        return f"""Generate a {project.complexity} complexity {project.project_type} project in {project.language}.
        
        Project Title: {project.title}
        Project Description: {project.description}
        
        Please provide:
        1. Complete source code files
        2. Any necessary configuration files
        3. Instructions for setup and running
        4. Brief explanation of the architecture
        
        Format the response with clear file sections using ```language headers."""
    
    def _clean_generated_code(self, code: str) -> str:
        """Clean and format generated code"""
        # Remove markdown code blocks if present
        lines = code.split('\n')
        cleaned_lines = []
        in_code_block = False
        
        for line in lines:
            if line.strip().startswith('```'):
                in_code_block = not in_code_block
                continue
            if not in_code_block and line.strip().startswith('`') and line.strip().endswith('`'):
                # Remove inline code markers
                cleaned_lines.append(line.strip('`'))
            else:
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)

# Initialize managers
ai_client_manager = AIClientManager()
project_manager = ProjectManager()
code_generator = CodeGenerator(ai_client_manager)

@app.route('/')
def index():
    """Home page"""
    return render_template('index.html',
                         languages=SUPPORTED_LANGUAGES,
                         project_types=PROJECT_TYPES,
                         ai_models=ai_client_manager.get_available_models())

@app.route('/generate', methods=['POST'])
def generate_project():
    """Generate a new project"""
    try:
        # Get form data
        project_data = {
            'title': request.form.get('title', '').strip(),
            'description': request.form.get('description', '').strip(),
            'language': request.form.get('language', 'python'),
            'project_type': request.form.get('project_type', 'web-app'),
            'complexity': request.form.get('complexity', 'intermediate'),
            'ai_model': request.form.get('ai_model', 'deepseek')
        }
        
        # Validate input
        if not project_data['title'] or not project_data['description']:
            return jsonify({'error': 'Title and description are required'}), 400
        
        if project_data['language'] not in SUPPORTED_LANGUAGES:
            return jsonify({'error': 'Unsupported language'}), 400
        
        if project_data['project_type'] not in PROJECT_TYPES:
            return jsonify({'error': 'Unsupported project type'}), 400
        
        if project_data['ai_model'] not in ai_client_manager.get_available_models():
            return jsonify({'error': 'Selected AI model is not available'}), 400
        
        # Create project
        project = project_manager.create_project(project_data)
        
        # Generate code
        generated_code = code_generator.generate_project_code(project)
        
        # Update project with generated code
        project_manager.update_project_code(project.id, generated_code)
        
        # Return success response
        return jsonify({
            'success': True,
            'project_id': project.id,
            'code': generated_code,
            'title': project.title
        })
        
    except Exception as e:
        logger.error(f"Error in generate_project: {e}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/project/<project_id>')
def view_project(project_id):
    """View a specific project"""
    project = project_manager.get_project(project_id)
    if not project:
        return "Project not found", 404
    
    return render_template('project.html', project=project)

@app.route('/projects')
def list_projects():
    """List all projects"""
    if 'user_id' in session:
        projects = project_manager.get_user_projects(session['user_id'])
    else:
        projects = project_manager.get_all_projects()
    
    return render_template('projects.html', projects=projects)

@app.route('/api/projects', methods=['GET'])
def api_list_projects():
    """API endpoint to list projects"""
    if 'user_id' in session:
        projects = project_manager.get_user_projects(session['user_id'])
    else:
        projects = project_manager.get_all_projects()
    
    projects_data = [asdict(project) for project in projects]
    return jsonify(projects_data)

@app.route('/api/project/<project_id>', methods=['GET'])
def api_get_project(project_id):
    """API endpoint to get a specific project"""
    project = project_manager.get_project(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    return jsonify(asdict(project))

@app.route('/api/project/<project_id>', methods=['DELETE'])
def api_delete_project(project_id):
    """API endpoint to delete a project"""
    if project_manager.delete_project(project_id):
        return jsonify({'success': True})
    return jsonify({'error': 'Project not found'}), 404

@app.route('/health')
def health_check():
    """Health check endpoint"""
    available_models = ai_client_manager.get_available_models()
    return jsonify({
        'status': 'healthy',
        'available_ai_models': available_models,
        'total_projects': len(project_manager.projects),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/config')
def config_info():
    """Display configuration information (for debugging)"""
    config = {
        'available_ai_models': ai_client_manager.get_available_models(),
        'supported_languages': SUPPORTED_LANGUAGES,
        'project_types': PROJECT_TYPES,
        'session_user': session.get('user_id'),
        'environment_keys': list(os.environ.keys()) if app.debug else []
    }
    return jsonify(config)

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check for required environment variables
    required_vars = ['DEEPSEEK_API_KEY']
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        logger.warning(f"Missing environment variables: {missing_vars}")
        logger.warning("Some AI models may not be available")
    
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting AI Project Generator v3.0 on port {port}")
    logger.info(f"Available AI models: {ai_client_manager.get_available_models()}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)