import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FolderOpen, Plus, Book, Users } from 'lucide-react';
import { getProsjekter } from '../api/index';
import { useQuery } from '@tanstack/react-query';

export default function LandingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects_list'],
    queryFn: getProsjekter,
    select: res => res.data,
    refetchOnWindowFocus: true
  });

  const projects = data || [];

  if (isLoading) return <div>Laster prosjekter...</div>;

  return (
    <div className="bg-white min-h-screen">
      {/* Hero section */}
      <section className="bg-blue-900 text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-8 sm:py-12 sm:px-6 md:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">MOP</h1>
            <p className="max-w-2xl mx-auto mt-6 text-xl">
              Miljø og Prosjekthåndteringssystem for oversikt over tiltak og prosjekter
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick access card */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Hurtigtilgang</h2>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/tiltak"
                  className="flex items-center gap-2 text-blue-700 hover:text-blue-800 transition-colors"
                >
                  <Book size={18} />
                  <span>Generelle tiltak</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin"
                  className="flex items-center gap-2 text-blue-700 hover:text-blue-800 transition-colors"
                >
                  <Users size={18} />
                  <span>Brukeradministrasjon</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/prosjekter"
                  className="flex items-center gap-2 text-blue-700 hover:text-blue-800 transition-colors"
                >
                  <FolderOpen size={18} />
                  <span>Prosjektadministrasjon</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* New project card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Plus size={28} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Opprett nytt prosjekt</h2>
            <p className="text-neutral-500 mb-6">Start et nytt prosjekt med predefinerte tiltak</p>
            <button className="bg-blue-500 text-white rounded-lg px-5 py-2.5 font-medium shadow-sm hover:bg-blue-600 transition-all">
              Nytt prosjekt
            </button>
          </div>
          
          {/* Recent projects */}
          <div className="md:col-span-2 lg:col-span-1">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Nylige prosjekter</h2>
            <div className="space-y-4">
              {projects.map(project => (
                <div 
                  key={project.id} 
                  className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-neutral-900">{project.name}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{project.description}</p>
                    </div>
                    <Link 
                      to={`/tiltak-prosjekt?id=${project.id}`} 
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <span>Åpne</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-500">Fremdrift</span>
                      <span className="text-neutral-700">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-neutral-400">
                    Sist oppdatert: {new Date(project.lastUpdated).toLocaleDateString('no-NO')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Projects list section */}
      <section className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8 border-t border-neutral-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-neutral-900">Alle prosjekter</h2>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1 bg-white text-neutral-700 rounded-lg px-4 py-2 text-sm font-medium border border-neutral-300 hover:bg-neutral-50">
              <FolderOpen size={16} />
              <span>Arkiverte</span>
            </button>
            <button className="inline-flex items-center gap-1 bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium">
              <Plus size={16} />
              <span>Nytt prosjekt</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-900 sm:pl-6">Prosjektnavn</th>
                <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 lg:table-cell">Beskrivelse</th>
                <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 sm:table-cell">Fremdrift</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900">Sist oppdatert</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Åpne</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-neutral-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-neutral-900 sm:pl-6">{project.navn}</td>
                  <td className="hidden px-3 py-4 text-sm text-neutral-500 lg:table-cell">{project.beskrivelse}</td>
                  <td className="hidden px-3 py-4 text-sm text-neutral-500 sm:table-cell">
                    <div className="flex items-center">
                      <div className="w-16 bg-neutral-100 rounded-full h-1.5 mr-2">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                      </div>
                      <span>{project.progress}%</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">{new Date(project.updatedAt).toLocaleDateString('no-NO')}</td>
                  <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link to={`/tiltak-prosjekt?id=${project.id}`} className="text-blue-600 hover:text-blue-900">
                      Åpne<span className="sr-only">, {project.name}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
