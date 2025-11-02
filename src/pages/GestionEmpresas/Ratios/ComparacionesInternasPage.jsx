import { useParams } from "react-router-dom";
import RatiosComparativos from "../../../components/GestionEmpresas/Ratios/RatiosComparativos";

export default function ComparacionesInternasPage() {
  const { empresaId } = useParams();
  return (
    <div className="p-4">
      <RatiosComparativos empresaId={Number(empresaId)} />
    </div>
  );
}
