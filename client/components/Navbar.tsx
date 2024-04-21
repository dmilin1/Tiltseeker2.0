import { Link } from "@tanstack/react-router";
import { ReactNode, useState } from "react";
import { FaDesktop, FaDiscord, FaHammer, FaHome, FaInfo } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoIosStats } from "react-icons/io";
import { LuBrainCircuit } from "react-icons/lu";
import MediaQuery from "react-responsive";

type NavbarButtonProps = {
    linkProps?: React.ComponentProps<typeof Link>;
    icon: ReactNode;
    text: string;
};

function NavbarButton({ linkProps, icon, text }: NavbarButtonProps) {
    return (
        <Link
            className="text-buttonText text-lg py-2 items-center justify-end mr-10"
            {...linkProps}
        >
            <div>
                {icon}
            </div>
            <div className="ml-2 leading-tight text-center">
                {text}
            </div>
        </Link>
    );
}

function NavbarButtonMobile({ linkProps, icon, text }: NavbarButtonProps) {
    return (
        <Link
            className="text-buttonText text-lg mb-4 items-center mr-10"
            {...linkProps}
        >
            <div>
                {icon}
            </div>
            <div className="ml-2 leading-tight text-center">
                {text}
            </div>
        </Link>
    );
}

function NavbarDesktop() {
    return (
        <>
            <NavbarButton
                linkProps={{ to: "/" }}
                icon={<FaHome />}
                text={'Home'}
            />
            <NavbarButton
                linkProps={{ to: "/tools/bestbans" }}
                icon={<FaHammer />}
                text={'Best Bans'}
            />
            <NavbarButton
                linkProps={{ to: "/tools/championstats" }}
                icon={<IoIosStats />}
                text={'Champion Stats'}
            />
            <NavbarButton
                linkProps={{ to: "/tools/compositionanalyzer" }}
                icon={<LuBrainCircuit />}
                text={'Composition Analyzer'}
            />
            <NavbarButton
                linkProps={{ to: "/desktopapp" }}
                icon={<FaDesktop />}
                text={'Desktop App'}
            />
            <NavbarButton
                linkProps={{ onClick: () => open('https://discord.com/invite/HVwkvFX') }}
                icon={<FaDiscord />}
                text={'Discord'}
            />
            <NavbarButton
                linkProps={{ to: '/about' }}
                icon={<FaInfo />}
                text={'About'}
            />
        </>
    )
}

function NavbarMobile() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="w-full justify-between">
            <NavbarButton
                linkProps={{
                    to: "/",
                    onClick: () => setIsMenuOpen(false),
                }}
                icon={<FaHome />}
                text={'Home'}
            />
            <div
                className="items-center justify-center w-16 mr-[-16px] cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <GiHamburgerMenu fontSize={40} className="text-buttonText py-2 items-center text-center" />
            </div>
            {isMenuOpen && (
                <div
                    className="absolute border-t-2 border-bg top-16 right-0 bg-tint w-full h-full flex-col p-6 z-[1000]"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <NavbarButtonMobile
                        linkProps={{ to: "/tools/bestbans" }}
                        icon={<FaHammer />}
                        text={'Best Bans'}
                    />
                    <NavbarButtonMobile
                        linkProps={{ to: "/tools/championstats" }}
                        icon={<IoIosStats />}
                        text={'Champion Stats'}
                    />
                    <NavbarButtonMobile
                        linkProps={{ to: "/tools/compositionanalyzer" }}
                        icon={<LuBrainCircuit />}
                        text={'Composition Analyzer'}
                    />
                    <NavbarButtonMobile
                        linkProps={{ to: "/desktopapp" }}
                        icon={<FaDesktop />}
                        text={'Desktop App'}
                    />
                    <NavbarButtonMobile
                        linkProps={{ onClick: () => open('https://discord.com/invite/HVwkvFX') }}
                        icon={<FaDiscord />}
                        text={'Discord'}
                    />
                    <NavbarButtonMobile
                        linkProps={{ to: '/about' }}
                        icon={<FaInfo />}
                        text={'About'}
                    />
                </div>
            
            )}
        </div>
    )
}

export default function Navbar() {
    return (
        <div className="bg-tint min-h-16 px-6">
            <MediaQuery minWidth={970}>
                <NavbarDesktop />
            </MediaQuery>
            <MediaQuery maxWidth={970}>
                <NavbarMobile />
            </MediaQuery>
        </div>
    )
}