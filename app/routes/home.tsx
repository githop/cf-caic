import type { Route } from "./+types/home";
import { Chat } from "../chat/Chat";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CF CAIC" },
    { name: "description", content: "Welcome to CAIC chat" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Chat />;
}
