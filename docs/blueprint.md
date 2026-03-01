# **App Name**: PonteiroScope

## Core Features:

- Dynamic Data Extraction: Connect to the URL 'https://www.ogmopgua.com.br/ogmopr/TempHtml/Ponteiros.html', fetch its HTML content, and dynamically parse the embedded table data using a configurable regex pattern, converting it into a structured format for display.
- Interactive Data Table: Display the extracted columns (Funcao, Sinal, Original_1, Temporario_1, Original_2, Temporario_2) in a clean, interactive, paginated, and sortable table on the web interface, allowing for easy data review.
- CSV Export Functionality: Provide a user-friendly option to download the currently displayed tabular data as a CSV file, adhering to the script's format (semicolon delimited, UTF8 encoded), mirroring the PowerShell export capability.
- Intelligent Data Insight Tool: A generative AI tool that can analyze the extracted tabular data, such as patterns in 'Sinal' and 'Temporario' columns, to provide concise summaries, highlight anomalies, or infer potential relationships and trends.

## Style Guidelines:

- A dark color scheme suitable for an analytical tool. Primary color for interactive elements and highlights: Blue (#3366CC). Background color for panels and surfaces: Deep subtle blue-grey (#1F242E). Accent color for call-to-actions and focal points: Bright sky blue (#67D0E4).
- Headline and body text font: 'Inter' (sans-serif), chosen for its modern, neutral, and objective appearance, ideal for presenting structured data clearly.
- Utilize a set of modern, crisp, vector-based icons that clearly represent data-related actions like export, sort, filter, and analytical views, maintaining consistency with the dark theme.
- Adopt a clean, grid-based layout for the data tables to maximize readability and ensure an organized presentation of information, with clear visual separation between sections.
- Incorporate subtle and smooth animations for user feedback during interactions such as sorting data, changing pagination, initiating data export, or when the AI generates new insights.