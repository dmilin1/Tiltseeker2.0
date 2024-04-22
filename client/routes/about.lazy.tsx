import { createLazyFileRoute } from "@tanstack/react-router"
import profilePic from '../assets/profilePic.jpg';

export const Route = createLazyFileRoute('/about')({
    component: About,
});


function About() {
    return (
        <div className="flex-col px-6 grow items-center justify-stretch pb-16 text-text">
            <div className="py-8">
                <img
                    src={profilePic}
                    alt="profile picture"
                    className="rounded-full h-32 w-32"
                />
            </div>
            <div className="text-xl">Dimitrie Milinovich III</div>
            <div className="mt-2 mx-8 lg:w-1/3 text-center text-subtleText">
                I'm a Software Engineer specializing in Full Stack Web Development and Data Science. League of Legends and computing have been longtime passions of mine and Tiltseeker is a culmination of my biggest hobbies.
            </div>
            <div className="text-xl mt-8 mx-8 text-center">
                Want To Work on Tiltseeker?
            </div>
            <div className="block mt-2 mx-2 lg:w-1/3 text-center text-subtleText">
               Tiltseeker is an <a className="inline-block text-blue-500" target="_blank" href="https://github.com/dmilin1/Tiltseeker2.0">open source project on GitHub</a> and open to public contributions. I'm always looking for help with new features, bug fixes, and more. If you'd like to get started, make a pull request!
            </div>
            <div className="text-xl mt-8 mx-8 text-center">
                Contact Me!
            </div>
            <div className="mt-2 mx-2 lg:w-1/3 text-center text-subtleText">
                I love hearing from others who have a passion for data in gaming. Whether you're searching for an advertising partner, looking for an API to use to collect stats, or simply working on your senior project and need ideas, I'd love to chat! Reach out at any of the links below, or through the Tiltseeker Discord channel (link the in navbar above).
            </div>
            <div className="flex-row w-full mt-4 lg:w-1/3 justify-evenly">
                <a
                    href="https://github.com/dmilin1"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xl text-center text-blue-500"
                >
                    GitHub
                </a>
                <a
                    href="https://www.linkedin.com/in/dmilinovich/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xl text-center text-blue-500"
                >
                    LinkedIn
                </a>
                <a
                    href="mailto:contact@tiltseeker.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xl text-center text-blue-500"
                >
                    Email
                </a>
            </div>
            <div className="mt-4 mx-2 lg:w-1/3 text-center text-subtleText">
                Or, add me on League and we can duo! My username is dmilin#shaco. Yes, I'm a dirty Shaco one trick.
            </div>
        </div>
    )
}