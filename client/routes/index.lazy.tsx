import { createLazyFileRoute } from '@tanstack/react-router';
import icon from '../assets/icon.png';
import { FaSearch } from 'react-icons/fa';

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="p-2">
      <div className='flex-col items-center mt-[15%]'>
        <img
          className="w-3/4 md:w-1/2 lg::w-1/3 xl:w-1/4"
          src={icon}
          alt="icon"
        />
        <div className='mt-8 bg-tint border-tint border-8 rounded-lg'>
          <div className='rounded overflow-hidden '>
            <select className='bg-bg text-buttonText text-lg items-center text-center outline-none'>
              {['NA', 'EUW', 'EUNE', 'KR', 'BR', 'LAN', 'LAS', 'OCE', 'TR', 'RU', 'JP'].map(region => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          <input
            className='bg-tint text-buttonText text-lg py-2 items-center text-center outline-none'
            placeholder='Summoner Name'
          />
          <div className='bg-tint items-center'>
            <FaSearch fontSize={32} className='text-buttonText py-2 items-center text-center' />
          </div>
        </div>
      </div>
    </div>
  )
}