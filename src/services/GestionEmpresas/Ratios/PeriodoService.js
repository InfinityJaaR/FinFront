import url from "../../utils/url";

export async function getPeriodos() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${url}periodos`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Error al obtener periodos");
  return res.json();
}
