import { createFileRoute, createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import icon from '../assets/icon.png';
import { FaSearch } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export const Route = createFileRoute('/')({
  component: Index,
    validateSearch: (search) => (
      z.object({
          error: z.string().optional(),
      }).parse(search)
  ),
})

const REGIONS = [{
  pretty: 'NA',
  full: 'NA1'
}, {
  pretty: 'EUW',
  full: 'EUW1'
}, {
  pretty: 'EUNE',
  full: 'EUN1'
}, {
  pretty: 'KR',
  full: 'KR'
}, {
  pretty: 'BR',
  full: 'BR1'
}, {
  pretty: 'LAN',
  full: 'LA1'
}, {
  pretty: 'LAS',
  full: 'LA2'
}, {
  pretty: 'OCE',
  full: 'OC1'
}, {
  pretty: 'TR',
  full: 'TR1'
}, {
  pretty: 'RU',
  full: 'RU'
}, {
  pretty: 'JP',
  full: 'JP1'
}]

function Index() {
  const navigate = Route.useNavigate();

  const error = Route.useSearch().error;
  const [region, setRegion] = useState(Cookies.get('region') ?? 'NA1');
  const [name, setName] = useState(Cookies.get('name') ?? '');

  const search = async () => {
    navigate({
      to: `/tiltseek`,
      search: {
        region,
        name: encodeURIComponent(name),
      }
    });
  }

  useEffect(() => {
    const enterKeyCallback = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        search();
      }
    };
    window.addEventListener('keydown', enterKeyCallback);
    return () => window.removeEventListener('keydown', enterKeyCallback);
  }, [name, region]);

  return (
    <div className="p-2 justify-center">
      <div className='flex-col items-center mt-[15%]'>
        <img
          className="w-3/4 md:w-1/2 lg::w-1/3 xl:w-1/4"
          src={icon}
          alt="icon"
        />
        <div className='mt-8 bg-tint border-tint border-8 rounded-lg'>
          <div className='rounded overflow-hidden'>
            <select
              className='bg-bg text-buttonText text-lg items-center text-center outline-none'
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                Cookies.set('region', e.target.value);
                navigate({ to: '/' });
              }}
            >
              {REGIONS.map(region => (
                <option key={region.full} value={region.full}>
                  {region.pretty}
                </option>
              ))}
            </select>
          </div>
          <input
            className='bg-tint text-buttonText text-lg py-2 items-center text-center outline-none'
            placeholder='Name#Tag'
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              Cookies.set('name', e.target.value);
              navigate({ to: '/' });
            }}
          />
          <div
            className='bg-tint items-center cursor-pointer px-2'
            onClick={() => search()}
          >
            <FaSearch fontSize={20} className='text-buttonText items-center text-center' />
          </div>
        </div>
        {error &&
          <div className='text-error text-center mt-4 mx-6'>
            {error}
          </div>
        }
      </div>
    </div>
  )
}