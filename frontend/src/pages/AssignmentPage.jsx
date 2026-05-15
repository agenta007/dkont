import { DeveloperHeader } from "../components/DeveloperHeader.jsx";
import { ViewTitle } from "../components/shared.jsx";
import { assignmentDocuments } from "../data/assignmentDocuments.js";

export function AssignmentPage() {
  return (
    <div>
      <DeveloperHeader title="Задание" />
      <main className="shell assignment-shell">
        <ViewTitle eyebrow="Assignment PDF" title="Съдържание на заданието">
          <div className="assignment-docs">
            {assignmentDocuments.map((document) => (
              <article key={document.file} className="assignment-doc">
                <h2>{document.title}</h2>
                {document.sections.map((section) => (
                  <section key={section.title} className="assignment-section">
                    <h3>{section.title}</h3>
                    {section.paragraphs?.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.items && (
                      <ul>
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </article>
            ))}
          </div>
        </ViewTitle>
      </main>
    </div>
  );
}
