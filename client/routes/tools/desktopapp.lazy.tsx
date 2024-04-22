import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute('/tools/desktopapp')({
    component: DesktopApp,
});


function DesktopApp() {

    return (
        <div className="p-2 grow items-stretch justify-center pb-16 text-text">
            <div className='flex-col items-stretch grow h-fit'>
                <div className='flex-col items-stretch'>
                    <div className='flex-row items-center justify-center m-4'>
                        <h1 className='text-2xl font-bold'>Desktop App</h1>
                    </div>
                    <div className='flex-col items-center justify-center'>
                        <div className='flex-col items-center lg:w-3/4 2xl:w-1/2'>
                            <p className='text-lg'>
                                Download the desktop app to get the best experience! The video below is from
                                an early preview of the desktop app. The desktop app builds all the websites
                                features into the League client! Join the Tiltseeker Discord (link in the
                                navbar above) to receive updates and to try it for yourself.
                            </p>
                        </div>
                        <div className='mt-8 w-full lg:w-3/4 2xl:w-1/2'>
                            <iframe className="aspect-video" width="100%" src="https://www.youtube.com/embed/efR5Znx8kI0" frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}