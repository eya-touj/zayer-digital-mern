import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./button";
import { useLang } from "../../context/LangContext";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { lang } = useLang();

  const isFr = lang === "fr";

  return (
    <section className="bg-white font-serif min-h-screen flex items-center justify-center py-12 px-4">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="w-full sm:w-10/12 md:w-8/12 text-center">
            <div
              className="bg-[url(https://cdn.21st.dev/assets/mirror/35/354f63f88b57aceea4536df0c0cff0c3592aa46fe887ff910751fefc12f3e76c.gif)] h-[250px] sm:h-[350px] md:h-[400px] bg-center bg-no-repeat bg-contain"
              aria-hidden="true"
            >
              <h1 className="text-center text-black text-6xl sm:text-7xl md:text-8xl pt-6 sm:pt-8 font-serif font-bold">
                404
              </h1>
            </div>

            <div className="mt-[-40px]">
              <h3 className="text-2xl text-black sm:text-3xl font-bold mb-3 font-serif">
                {isFr ? "On dirait que vous êtes perdu" : "Look like you're lost"}
              </h3>
              <p className="mb-6 text-slate-600 sm:mb-5 font-sans">
                {isFr
                  ? "La page que vous cherchez n'est pas disponible !"
                  : "The page you are looking for is not available!"}
              </p>

              <Button
                variant="default"
                onClick={() => navigate("/")}
                className="my-3 bg-[#0a1628] hover:bg-[#c8a96e] hover:text-[#0a1628] text-white px-8 py-3 text-sm font-semibold tracking-wider uppercase transition-all duration-300"
              >
                {isFr ? "Retour à l'accueil" : "Go to Home"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
