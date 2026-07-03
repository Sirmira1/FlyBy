import { redirect } from "next/navigation";

export default function Home() {
  // FlyBy is a single-surface map app — send the root straight to the map.
  redirect("/map");
}
