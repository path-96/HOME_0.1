# HOME 0.1

A specialized productivity workspace designed for **FA (Factory Automation) Control Engineers**. It streamlines the management of diverse automation tools and network configurations required for different control systems (e.g., Mitsubishi, Keyence, Omron).

## 🏭 Designed for FA Engineers

Control engineers often switch between different systems, each requiring specific software tools (PLC programming, sensor configuration) and unique network settings. **HOME 0.1** solves this context-switching problem:

*   **Project-Based Tool Management**:
    *   Working on a **Mitsubishi** system? Create a project and add shortcuts for **GX Works**, **GT Designer**, and specific sensor tools.
    *   Switching to a **Keyence** system? Just switch projects, and your workspace instantly updates to show **KV Studio** and related manuals.
*   **Automated Network Switching**:
    *   Forget manually changing your IP address via Control Panel.
    *   Define the network setting for each project (e.g., `192.168.3.100` for Line A, `192.168.0.10` for Line B).
    *   When you switch projects, **HOME 0.1** automatically reconfigures your PC's network adapter to match the target system.

## Features

### 📁 Project Management
- **Organize Work**: Create distinct projects to keep your work separated.
- **Project-Specific Data**: Each project has its own set of shortcuts, notes, and network settings.
- **Automated Network Switching**: Automatically change your system's IP address and Gateway settings when switching between projects (requires Administrator privileges).

### 🔗 Smart Shortcuts
- **Quick Access**: Add shortcuts to files, folders, or URLs for easy access.
- **Drag & Drop Import**: Simply drag files or folders into the app to create shortcuts.
- **Drag & Drop Reordering**: Easily rearrange your shortcuts grid by dragging items.
- **Global Shortcuts**: Pin your most used items to the sidebar for access across all projects.

### 📝 Integrated Notes
- **Rich Text Editor**: Write notes with formatting support (headings, lists, bold, italic, etc.).
- **Import & Export**: Import text/markdown files and export your notes to Markdown.
- **Auto-Save**: Notes are saved automatically as you type.
- **Mini & Large Views**: Switch between a quick-access mini view and a full-screen modal editor.

### 📅 Calendar Integration
- **Google Calendar**: View your schedule directly within the app.
- **Localization**: Full Japanese language support including date formats and navigation.
- **Visual Cues**: Distinct styling for weekends and today's date.
- **Memos**: Add daily memos to dates on the calendar.

### ⚙️ Customization & Settings
- **Monochrome Theme**: A sleek, distraction-free monochrome design (Light/Dark modes).
- **Language Support**: Switch between English and Japanese interfaces.
- **Global Network Settings**: Configure the default network interface (e.g., Ethernet, Wi-Fi) to be managed by the application.
- **Data Management**: Export/Import your entire workspace data for backup.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd HOME_0.1
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

### Running the App

Start the development server:
```bash
npm run dev
```

### Building for Production

Build the application for your OS:
```bash
npm run build
```

## Tech Stack
- **Electron**: Desktop application runtime.
- **Vite**: Fast build tool and development server.
- **React**: UI library.
- **Tailwind CSS**: Utility-first CSS framework.
- **TypeScript**: Type-safe code.

## License
MIT
