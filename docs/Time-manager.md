Time manager

# Following the Dev OPS philosophy
Since you are the sharpest tool in the box, you take the excellent initiative of implementing the DevOps methodology for this new project.
Doing so, you will be more agile, reduce your delivery delays through automations that accelerate development and ensure the quality of your project.
Before starting to develop your software, it's important to start considering which technologies to use and how to structure the project.
The authorized technologies are listed in the subject for the backend and frontend parts.
Once you defined them, next step is to implement some good DevOps practices. Set up your environments is crucial as well as define how you will collaborate and what are the tasks that you will do.
We all want to go fast in the action of the the code, but more time you spend on planning, less time you waste on unpredictable problem.

## Project Construction
As part of this project, you will have to develop two independent parts. The authorized technologies are listed in the subject for the backend and frontend parts.
To homogenize the project's construction, you will use Docker and Docker Compose.
You must dockerize your backend and your frontend, if possible.
If you choose to do a mobile client your docker image must handle the build of your APK.

## Build your project
You will have to make a compose.yml file at the root of your project, which will describe the different docker services used.
This file must include at least the following docker services:
- a backend service to launch the backend server;
- a frontend service to launch or build the frontend;
- a databases service to launch the database;
- a reverse proxy service to:
    – allow access to the backend and frontend services;
    – expose a public port.
Check the documentation about network, depends_on, and multistage.
Your project is intended to be able to go into production, prepare the ground by creating a second Docker Compose file for this environment.
Build for production implies several aspects to take in consideration.

## docker-compose up
Validation of the integrity of your images will be done when launching the docker-compose up command.
The following points must be respected :
- the backend service will run and exposed on the port of your choice;
- the frontend service will run and exposed on the port of your choice;
- if the client is a mobile application , it must build and provide the version of mobile client service;
- the database service will must persist the data.

## Testing
To ensure the quality of a project, testing it is important. You can do it manually but it will be quickly time consuming...
To assert the behaviour of your backend application and avoid regression you're expected to write tests.
Your backend which is the core of your application containing the business logic must be tested.
You're expected to test as many routes as possible of your API.
Untested routes must be justified.
For each framework, there are testing tools.

## Pipeline
You will work with GitHub (organization EPITEHCMSC) as your source control management platform.
To facilitate collaboration it's important to define your git flow and configure your repository in consideration: branch protection, commit message norm, merge request configuration, ...
How to contribute to your project could be a nice information to have in your README for other developers.
Working on your project, adding new features and ensuring the quality needs several repetitive manual tasks: building, launching tests, etc.
The automation must be your new best friend, saving time and avoiding human errors.
Using GitHub actions, you MUST create a pipeline with the following jobs:
- build your frontend and backend;
- launch your tests;
- create a test coverage report.
The logs of your CI must be managed carefully.
What is a mistake if everything is a mistake ?
GitHub and its environment are very powerful, and the possibilities are plentiful. Don't hesitate to explore them.


# Backend application
Your application will allow your employees to put their arrivals and departures and their manager to handle the teams and see KPIs of company members.
Manage employees in teams and handle schedules need a lot of logic and need to be develop carefully avoiding errors in work hours count that can lead to strikes.
Mainly, your application allows the employees of a company to:
- report their arrival and departure times;
- view a summary of their working hours.
As said earlier your application will be composed of two main parts:
- the backend application;
- you frontend client.
All the business logic and features of your application will be contained in your backend server.
The backend is the core of your application.
The backend must be exclusively an API.

## API
Your Application Programming Interface must be RESTful.
The user's (employees and managers) content allows recording users' information, such as:
- first name;
- last name;
- email;
- phone number.
The team's content allows recording some information about a team, such as:
- name;
- description;
- members;
- manager.
You must implement, at least, the following routes and endpoints:
- GET /users retrieves the users;
- POST /users adds a user;
- PUT /users/{id} updates a user;
- DELETE /users/{id} deletes a user;
- GET /teams retrieves the teams;
- POST /teams adds a team;
- PUT /teams/{id} updates a team;
- DELETE /teams/{id} deletes a team;
- POST /clocks Set the arrival / departure of the authenticated use;
- GET /users/{id}/clocks Get a summary of the arrivals and departures of an employee;
- GET /reports Get a global report based on the chosen KPIs

## Roles
Your application is aimed at two kind of users: employees and managers.
These two roles will allow users to have access to specific features.
Below is a list of features that you should implement:
- Common features:
    – edit their account informations;
    – delete their account;
    – report their departure and arrival times;
    – view their dashboards.
- Managers features:
    – manage their team(s);
    – view the averages of the daily and weekly hours of the team over a given period;
    – view the daily and weekly working hours of an employee over a period of time;
    – view their employees' dashboards.
This list of features is non-exhaustive (no more than the list of dashboards).
It is essential to adapt it according to your research and the various audits that you will carry out, so that the application corresponds to the needs of each category of users.

## KPI
You must choose at least 2 types of KPIs (e.g., lateness rate, etc.).

## Authentification
### User Management
As the application is centred on the digital life of users, it must therefore offer a management of the latter.
To do this, you must create a user management module.
The client asks non-identified users to be registered by the managers.
An administration section would be useful to manage site users.
### Request Authentification
Each API request must be secured with a token when the page requires authentication.
Json Web Token
### Authentication / Identification
Using the application requires knowing the user in question.
To do this, it is necessary to implement the following option:
- a method of user authentication via a username / password;
- password management
Fake email, such as Mailpit.
Ensure that basic security measures are in place to prevent credential theft.

## Technologies backend
You can choose (and justify why) from the following technologies to build your project :
- JS: Node (express is allowed);
- Compiled: Go;
- Python : Django;
- PHP : Symfony;
- Java : Spring boot;
- Elixir : Phoenix;
- SQL: MariaDB or POSTGRESQL;
- NoSQL: MongoDB.
Anything not on this list is prohibited.

# Frontend application
To develop the frontend, you have two options: build a mobile application or a web application.
You must use the RESTFUL API that was developed to implement the frontend.
Interfaces
You must implement, at least, the corresponding views:
- Authentification:
    – login;
- Users:
    – retrieves the users;
    – adds a user;
    – updates a user;
    – deletes a user;
- Teams:
    – retrieves the teams;
    – adds a team;
    – updates a team;
    – deletes a team;
- Time management:
    – set the arrival / departure of the authenticated user;
    – set a summary of the arrivals and departures of an employee;
    – get arrivals and departures;
- KPI:
    – get a global report based on the chosen KPIs.

## Role and security
There are two roles, namely **employee** and **manager**.
It is important to manage security on the pages according to the respective roles.
Of course, the requests must be protected to restrict access only to those who are authorized.
Using the application requires knowing the user in question.
To do this, it is necessary to implement the following options:
- a method of user authentication;
- password management;
- token.
Below is a list of features that you should implement:
- Common features:
    – edit their account informations;
    – delete their account;
    – report their departure and arrival times;
    – view their dashboards.
- Managers features:
    – manage their team(s);
    – view the averages of the daily and weekly hours of the team over a given period;
    – view the daily and weekly working hours of an employee over a period of time;
    – view their employees' dashboards.
This list of features is non-exhaustive (no more than the list of dashboards).
You can add more if you find them relevant.

## UX & Accessibility Awareness
To ensure your application can be effectively used by all users, regardless of their context, device, or abilities, you must integrate good UX (User Experience) and Accessibility practices throughout your project.
Building an accessible and usable interface is not just a matter of compliance, it’s a matter of quality, inclusion, and efficiency.
Why it matters
A clear and consistent user experience increases adoption and reduces user errors.
Accessibility ensures that people with disabilities (visual, motor, hearing, cognitive) can use your product.
It improves SEO, usability, and overall quality perception.
Your project must include accessibility and UX considerations from the design phase to the CI pipeline.

## Technologies frontend
You can choose (and justify why) from the following technologies to build your project :
- Frontend: React.js, Vue.js, Angular;
- Android application: Kotlin, Java;
- iOS application: Swift;
- Cross Platform: React Native, Flutter.
Anything not on this list is prohibited.

## Documentation
Take the time to define a simple and scalable architecture, without code duplication.
You are expected to provide clear and simple documentation of your project.
The goal is to have a document that serves as a working support to easily understand the project in order to facilitate communication in the work teams and facilitate the integration of new developers.
Thus, there is no need to make class or sequence diagrams of the entire project, but rather to choose the important parts to understand what needs to be documented.
You must provide a README.md file describing your project and how setup it for the launch. This file must be written using the [markdown format].

## Keynote
At the end of your project you will have to:
- present the good practices that you have implemented to build your project;
- present your documentation;
- show your CI in action;
- defend your technos' choice;
- show your code and architecture.

# Grading criteria
dockerfiles	: Students deliver some valid Dockerfiles of images containerizing the app, for both dev and prod environments.
containers : frontend, web backend and database are isolated inside different containers.
persistency	: logs are persistent, even if containers stop, restart or crash.
orchestration : The containers are orchestrated via docker-compose.
clean_deploy : The docker configurations supplied by the students differentiate various environments.
env_specificity : Environment variables are specific (ie. they are not the same for different environments)
secrets : Secrets (token, password, keys...) are not commit to git in clear-text and are not visible to not granted people.
api_crafting : A functional REST API is delivered.
data_persist : A coherent database is used to ensure data persistence without redundancy, including at least various tables to store data. Students can draw or show a schema of the database.
data_viz : The web application allows to visualize relevant and well presented charts.
roles : Students defined some relevant roles with cascading rights.
auth_jwt : To use the application, a JWT authentication is mandatory.
auth_persist : Once authenticated, the user stays in the same session until it expires.
auth_sec : Students expose at least one method to protect session management against CSRF and XSS attacks.
api_consumption : The front application consumes data from the back API previously built by students
code_orga : Front application's code is relevantly organized in classes.
uiux_quality : The delivery offers a high-quality, polished UX and UI : the interface are well conceived to provide a good experience to its users
hmi : Students deliver a functional frontend application with different views/interfaces.
constraints : Students chose technologies that respect the technical constraints provided in the subject.
framework_front : Students use a tool to improve frontend development efficiency, and they provide a professional justification for why they chose it and how they use it.
framework_back : Students use a tool to improve backend development efficiency, and they provide a professional justification for why they chose it and how they use it.
maintainability : The code is easily maintainable (human readable names, atomicity of each functions, clear code structure, clean syntax)
robustness : The web console does NOT display errors.
tests_sequence : A sequence of unit tests is provided and easily runnable
tests_coverage : An evaluation of the proportion of source code executed and tested is delivered.
tests_automation : A tests sequence is automatically launched via a script or a pipeline
ci_pipeline : Students deliver some YAML file(s) defining steps of a complete CI pipeline
ci_quality : CI pipeline is stopped when the code does not pass quality checks (unit tests, integration test, linting, ...).
versioning_basics : Students use a versioning tool with a proper workflow, including branching strategy, regular commits, descriptive messages, and a gitignore file
doc_basic_ : Students deliver a technical documentation for the application, covering at least the technological choices, the components and architecture design.
presentation : The project is presented in a professional way using a relevant support (slides and/or demo)
argumentation : Students support their presentation or technical choices with well-structured arguments, providing logical explanations and evidences
answers : Students provide relevant and concise answers for 3 (ops+back+front) technical questions.


# Course competencies
## Application support - Level 3
Skill description: Delivering management, technical and administrative services to support and maintain live applications.
Level description: Follows agreed procedures to identify and resolve issues with applications. Uses application management software and tools to collect agreed performance statistics. Carries out agreed applications maintenance tasks.
Requirements: doc_basic

## Communication - Level 3
Skill description: Exchanging information, ideas and insights clearly to enable mutual understanding and cooperation.
Level description: Communicates with team and stakeholders inside and outside the organisation clearly explaining and presenting information. Contributes to a range of work-related conversations and listens to others to gain an understanding and asks probing questions relevant to their role.
Requirements: presentation, argumentation, answers

## Deployment - Level 3
Skill description: Transitioning software from development to live usage, managing risks and ensuring it works as intended.
Level description: Deploys software releases and updates to production environments. Uses deployment tools and techniques to ensure consistent deployments. Monitors and troubleshoots deployment processes. Performs rollbacks of deployments in case of issues or failures. Collaborates with release management and operations teams.
Requirements: clean_deploy, env_specificity

## User experience design - Level 3
Skill description: Producing design concepts and prototypes for user interactions and experiences of a product, system or service.
Level description: Applies standard techniques and tools for designing user interactions with and experiences of selected system, product or service components. Reviews design goals and agreed security, usability and accessibility requirements. Creates design artefacts to communicate ideas. Contributes to overall user experience design as part of a team. Assists in evaluating design options and trade-offs. Considers and applies visual design and branding guidelines consistently when appropriate.
Requirements: uiux_quality, hmi

## Identity and access management - Level 3
Skill description: Manages identity verification and access permissions within organisational systems and environments.
Level description: Administers standard identity and access management services, implementing policies and resolving related issues. Manages monitoring, audits and logging for identity and access management systems. Investigates minor security breaches in accordance with established procedures related to identity and access management. Assists users in defining their access rights and privileges. Designs and implements simple identity and access management solutions, enhancing user access security. Contributes to the enhancement and optimisation of existing identity and access management processes and systems.
Requirements: secrets, roles, auth_jwt, auth_persist, auth_sec

## Content design and authoring - Level 3
Skill description: Planning, designing and creating content that meets user-centred and organisational needs, encompassing textual information, graphical content and multimedia elements.
Level description: Produces information artefacts that are accurate, current, relevant and easily understood by the intended audience. Clarifies detailed content requirements with clients and representatives of the intended audience. Designs, creates, controls and evaluates moderately complex subject matter. Makes informed decisions about the best way to present information to an audience. Applies moderation and editing processes to content supplied by others.
Requirements: presentation

## Infrastructure operations - Level 3
Skill description: Provisioning, deploying, configuring, operating and optimising technology infrastructure across physical, virtual and cloud-based environments.
Level description: Provisions, deploys and configures infrastructure services and components. Monitors infrastructure for load, performance and security events. Reports metrics and resolves operational issues. Executes standard operational procedures, including backups and restorations. Carries out agreed system software maintenance tasks. Automates routine system administration tasks to specifications using standard tools and basic scripting.
Requirements: dockerfiles, containers, persistency, orchestration, env_specificity, secrets

## Methods and tools - Level 3
Skill description: Leads the adoption, management and optimisation of methods and tools, ensuring effective use and alignment with organisational objectives.
Level description: Provides support on the use of existing methods and tools. Configures and maintains methods and tools within a known context. Creates and updates the documentation of methods and tools. Identifies and resolves basic issues related to tool usage.
Requirements: code_orga, framework_front, framework_back

## Programming/software development - Level 3
Skill description: Developing software components to deliver value to stakeholders.
Level description: Designs, codes, verifies, tests, documents, amends and refactors moderately complex programs/scripts. Applies agreed standards, tools and security measures to achieve a well-engineered result. Monitors and reports on progress. Identifies issues related to software development activities. Proposes practical solutions to resolve issues. Collaborates in reviews of work with others as appropriate.
Requirements: api_crafting, api_consumption, code_orga, constraints, framework_front, framework_back, maintainability, robustness, doc_basic

## Quality assurance - Level 3
Skill description: Assuring, through ongoing and periodic assessments and reviews, that the organisation’s quality objectives are being met.
Level description: Contributes to the collection of evidence and the conduct of formal audits or reviews of activities. Examines records for evidence that appropriate testing and other quality control activities have taken place. Determines compliance with organisational directives, standards and procedures and identifies non-compliances, non-conformances and abnormal occurrences.
Requirements: tests_sequence, tests_coverage, tests_automation, ci_quality

## Systems integration and build - Level 3
Skill description: Planning, implementing and controlling activities to integrate system elements, subsystems and interfaces to create operational systems, products or services.
Level description: Defines the modules and components and dependencies needed for an integration build and produces a build definition. Accepts completed modules and components, checking that they meet defined criteria. Produces builds from system components for loading onto target environments. Configures the hardware, software and infrastructure environment as required by the system being integrated. Produces integration test specifications, conducts tests and records and reports on outcomes. Diagnoses faults and documents the results of tests. Produces system integration reports.
Requirements: containers, ci_pipeline, ci_quality, versioning_basics

## Systems and software lifecycle engineering - Level 3
Skill description: Establishing and deploying an environment for developing, continually improving and securely operating software and systems products and services.
Level description: Provides support for implementing systems and software lifecycle practices by applying established methods and procedures. Supports automation and continuous integration processes under direction. Monitors and reports on the effectiveness of lifecycle management activities. Contributes to the documentation and maintenance of lifecycle tools and practices.
Requirements: tests_automation, ci_pipeline, ci_quality

## Storage management - Level 3
Skill description: Provisioning, configuring and optimising on-premises and cloud-based storage solutions, ensuring data availability, security and alignment with business objectives.
Level description: Executes routine storage management tasks following established procedures and using standard tools. Implements documented configurations for allocation of storage, installation and maintenance of secure storage systems using the agreed operational procedures. Identifies operational problems, including security-related issues, and contributes to their resolution. Uses standard management and reporting tools to collect and report on storage utilisation, performance and backup statistics.
Requirements: persistency, data_persist, auth_persist

## Functional testing - Level 3
Skill description: Assessing specified or unspecified functional requirements and characteristics of products, systems and services through investigation and testing.
Level description: Designs detailed functional test cases and scripts, covering various scenarios and boundary values. Actively participates in requirement and design reviews, refining test plans based on insights gained. Undertakes structured exploratory testing to investigate and verify functionality. Prepares test data, configures environments and automates repeatable tests. Executes tests, logs defects with detailed information and analyses results to assess system functionality.
Requirements: tests_sequence, tests_coverage, tests_automation

## Data visualisation - Level 3
Skill description: Facilitating understanding of data by displaying concepts, ideas and facts using graphical representations.
Level description: Uses visualisation products, as guided, to design and create data visuals. Selects appropriate visualisation techniques from the options available. Engages with the target user to prototype and refine specified visualisations. Assists in developing narratives around data sets to support understanding and decision-making.
Requirements: data_viz
