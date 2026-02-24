import { Button } from "@/components/UI/Button/Button";
import Image from "next/image";
import css from "./page.module.css";
import clsx from "clsx";

// export const metadata: Metadata = {
//   title: "TravelTrucks | Campers of your dreams",
//   description:
//     "Rent the best campervans and motorhomes. You can find everything you want in our catalog for your perfect road trip.",
//   keywords: ["campervan rental", "road trip", "motorhome hire", "TravelTrucks"],
//   openGraph: {
//     title: "TravelTrucks | Campers of your dreams",
//     description: "Rent the best campervans for your next adventure.",
//     type: "website",
//     images: [
//       {
//         url: "/hero/hero-bg.webp",
//         width: 1200,
//         height: 630,
//         alt: "TravelTrucks Campervan",
//       },
//     ],
//   },
// };

export default function Home() {
  return (
    <main className={css.main}>
      <div className={css.hero}>
        <div className={clsx(css.heroWrapper, "container")}>
          <div className={css.contentWrapper}>
            <h1 className={css.title}>
              The road to the <span>depths</span> of the human soul
            </h1>
            <p className={css.description}>
              We help you to reveal your potential, overcome challenges and find
              a guide in your own life with the help of our experienced
              psychologists.
            </p>
            <Button className={css.heroBtn}>
              Get started
              <svg
                width="14"
                height="16"
                viewBox="0 0 14 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.6215 0.860952C12.5447 0.314042 12.039 -0.067006 11.4921 0.00985689L2.57967 1.26242C2.03276 1.33928 1.65171 1.84495 1.72857 2.39186C1.80544 2.93877 2.31111 3.31981 2.85802 3.24295L10.7802 2.12957L11.8935 10.0517C11.9704 10.5986 12.4761 10.9797 13.023 10.9028C13.5699 10.8259 13.9509 10.3203 13.8741 9.77336L12.6215 0.860952ZM1.59722 15.9774L12.4299 1.60194L10.8326 0.398311L-5.14388e-05 14.7737L1.59722 15.9774Z"
                  fill="#FBFBFB"
                />
              </svg>
            </Button>
          </div>
          <div className={css.imageBox}>
            <Image
              className={css.image}
              width={464}
              height={526}
              src="/hero/hero.webp"
              alt="Experienced psychologists"
            />
            <div className={css.imageInfo}>
              <div className={css.infoIcon}>
                <svg width={20} height={15} className={css.feCheck}>
                  <use href={`./sprite.svg#feCheck`}></use>
                </svg>
              </div>
              <div className={css.infoWrapper}>
                <p className={css.infotitle}>Experienced psychologists</p>
                <p className={css.infoCount}>15,000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
