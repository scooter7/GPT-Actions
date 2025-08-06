# AI Development Rules

This document outlines the rules and conventions for the AI assistant to follow when developing and modifying this application.

## Tech Stack

This is a full-stack application with a distinct client and server.

-   **Frontend Framework**: Next.js 14 with the App Router.
-   **UI Library**: React 18.
-   **Styling**: Tailwind CSS for all styling.
-   **Backend Framework**: Python with Flask.
-   **Database ORM**: SQLAlchemy for database operations.
-   **HTTP Client**: Axios for client-side API requests.
-   **Icons**: `lucide-react` for icons.
-   **UI Components**: Use components from the `shadcn/ui` library where applicable.

## Development Guidelines

### General
-   The project is split into a `client` (Next.js) and a `server` (Flask) directory. Maintain this separation.
-   Do not introduce new major technologies or libraries without explicit instruction.

### Frontend (`client/` directory)
-   **Routing**: Use the Next.js App Router for all pages and routes. New pages should be created as `page.js` files within the `client/app` directory structure.
-   **Components**:
    -   Create new reusable components in a `client/components` directory.
    -   Keep components small, focused, and functional.
    -   Prefer using pre-built `shadcn/ui` components for common UI elements like buttons, inputs, dialogs, etc.
-   **Styling**:
    -   Use **Tailwind CSS** utility classes exclusively for styling.
    -   Do not write custom CSS in `.css` files or use inline `style` attributes unless absolutely necessary.
-   **State Management**: Use React's built-in hooks (`useState`, `useEffect`, `useContext`) for state management.
-   **Data Fetching**: Use **Axios** for all API calls to the backend.
-   **Icons**: Use icons from the `lucide-react` library.

### Backend (`server/` directory)
-   **API Endpoints**: All API routes are defined in `server/webserver.py` using Flask.
-   **Database**:
    -   Database models are defined in `server/database.py` using SQLAlchemy.
    -   All database interactions should go through the SQLAlchemy ORM.
-   **Dependencies**: Add new Python dependencies to `server/requirements.txt`.