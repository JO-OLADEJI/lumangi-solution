import {
  ConnectEmbed,
  SmartWallet,
  useAddress,
  useSDK,
  useShowConnectEmbed,
  useUser,
  useWallet,
} from "@thirdweb-dev/react";
import React, { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import { useRouter } from "next/router";
import { getUser } from "./api/auth/[...thirdweb]";
import { LORD_CONTRACT_ADDRESS } from "../constants/contracts";
import LoadingAnimation from "../components/LoadingAnimator";

const Login = () => {
  const showConnectedEmbed = useShowConnectEmbed();
  const { isLoggedIn, isLoading } = useUser();
  const router = useRouter();
  const wallet = useWallet();
  const address = useAddress();
  const sdk = useSDK();
  const [loadingLordStatus, setLoadingLordStatus] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const checkNewPlayer = async () => {
    console.log({ address });
    try {
      if (wallet instanceof SmartWallet && address && sdk) {
        setLoadingLordStatus(true);
        setLoadingMessage("Checking lord balance...");

        const lordContract = await sdk.getContract(LORD_CONTRACT_ADDRESS);
        const lordBalance = await lordContract.erc721.balanceOf(address);

        if (lordBalance.toNumber() === 0) {
          setLoadingMessage("No worker found...");
          try {
            setLoadingMessage("Minting new lord and tokens...");
            const response = await fetch("/api/claimTokens", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ address }),
            });

            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.message);
            }

            setLoadingMessage("Lord and tokens claimed...");
          } catch (error) {
            console.log(error);
          } finally {
            setLoadingMessage("");
            router.push("/");
          }
        } else {
          setLoadingMessage("");
          router.push("/");
        }
      } else if (address) {
        router.push("/");
      } else {
        alert("Error connecting wallet");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (address && isLoggedIn && !isLoading) {
      checkNewPlayer();
    }
  }, [isLoggedIn, isLoading, address]);

  if (loadingLordStatus) {
    return (
      <div className={styles.loading_titled_container}>
        <h1 className="">{loadingMessage}</h1>
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headers_login}>
        <img src="/images/logo.png" alt="" />
        <h1 className="">Crafting Kingdoms</h1>
      </div>
      {showConnectedEmbed && (
        <ConnectEmbed
          auth={{
            loginOptional: false,
          }}
          showThirdwebBranding={false}
        />
      )}
    </div>
  );
};

export default Login;

export async function getServerSideProps(context: any) {
  const user = await getUser(context.req);

  if (user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
