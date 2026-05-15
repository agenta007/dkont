import { useNavigate } from "react-router-dom";
import { BrandHeader } from "./BrandHeader.jsx";

export function DeveloperHeader({ title }) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <BrandHeader eyebrow="Developer area" title={title} />
      <div className="developer-actions">
        <button className="secondary" onClick={() => navigate("/checklist")}>Задачи</button>
        <button className="secondary" onClick={() => navigate("/assignment")}>Задание</button>
        <button className="secondary" onClick={() => navigate("/documentation")}>Документация</button>
        <button onClick={() => navigate("/")}>Вход в приложението</button>
      </div>
    </header>
  );
}
