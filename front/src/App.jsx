import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CompraView from "./routes/CompraView";
import VentaScanner from "./routes/VentaScanner";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CompraView />} />
        <Route path="/scanner" element={<VentaScanner />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
