import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, Clock, Star } from 'lucide-react';
import { getProsjekter } from '@/api/endpoints';
import { useProjectStore } from '@/stores/userStore';
import { Button } from '@/components/ui/primitives/button';

/**
 * ProjectSelector Component
 *
 * Smart project selection with:
 * - Current project on top (disabled)
 * - Recently visited projects next
 * - Rest alphabetically
 * - Search functionality
 */
export const ProjectSelector = ({
  currentProjectId,
  onSelect,
  onCancel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const { recentProjects } = useProjectStore();

  // Fetch all projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects_for_copy'],
    queryFn: getProsjekter,
    select: (res) => res.data || [],
  });

  // Smart sorting: Current → Recent → Alphabetical
  const sortedProjects = useMemo(() => {
    if (!projects.length) return [];

    // Get IDs of recent projects (from store)
    const recentIds = (recentProjects || []).map(p => p.id);

    // Categorize projects
    const current = [];
    const recent = [];
    const others = [];

    projects.forEach(project => {
      if (project.id === currentProjectId) {
        current.push(project);
      } else if (recentIds.includes(project.id)) {
        recent.push(project);
      } else {
        others.push(project);
      }
    });

    // Sort recent by last visited (most recent first)
    recent.sort((a, b) => {
      const aIndex = recentIds.indexOf(a.id);
      const bIndex = recentIds.indexOf(b.id);
      return aIndex - bIndex;
    });

    // Sort others alphabetically
    others.sort((a, b) => a.navn.localeCompare(b.navn));

    return [...current, ...recent, ...others];
  }, [projects, currentProjectId, recentProjects]);

  // Filter by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return sortedProjects;

    const query = searchQuery.toLowerCase();
    return sortedProjects.filter(project =>
      project.navn.toLowerCase().includes(query) ||
      project.prosjektnummer?.toLowerCase().includes(query)
    );
  }, [sortedProjects, searchQuery]);

  const handleSelect = () => {
    if (!selectedProjectId) return;

    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      onSelect(project);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <p className="text-sm text-gray-600">
        Velg hvilket prosjekt du vil kopiere de valgte enhetene til.
      </p>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Søk etter prosjektnavn eller prosjektnummer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-sky-300 transition-colors"
          autoFocus
        />
      </div>

      {/* Project List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Prosjekter ({filteredProjects.length})</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-sky-600 hover:text-sky-700 text-sm"
            >
              Nullstill søk
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-2"></div>
            Laster prosjekter...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? (
              <>
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Ingen prosjekter funnet for "{searchQuery}"</p>
              </>
            ) : (
              <>
                <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Ingen prosjekter tilgjengelig</p>
              </>
            )}
          </div>
        ) : (
          <div className="border-2 border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredProjects.map((project, index) => {
              const isCurrent = project.id === currentProjectId;
              const isRecent = (recentProjects || []).some(p => p.id === project.id) && !isCurrent;
              const isSelected = selectedProjectId === project.id;

              return (
                <button
                  key={project.id}
                  onClick={() => {
                    if (isCurrent) return;
                    // Toggle selection - deselect if already selected
                    setSelectedProjectId(isSelected ? null : project.id);
                  }}
                  disabled={isCurrent}
                  className={`
                    w-full text-left px-4 py-3 flex items-center gap-3
                    transition-colors
                    ${isCurrent
                      ? 'bg-gray-50 cursor-not-allowed opacity-60'
                      : isSelected
                      ? 'bg-sky-50 hover:bg-sky-100'
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Selection Radio */}
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex-shrink-0
                    flex items-center justify-center
                    ${isSelected
                      ? 'border-sky-600 bg-sky-600'
                      : 'border-gray-300'
                    }
                  `}>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${isSelected ? 'text-sky-900' : 'text-gray-900'}`}>
                        {project.navn}
                      </p>

                      {/* Badges */}
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded font-medium">
                          NÅVÆRENDE
                        </span>
                      )}
                      {isRecent && !isCurrent && (
                        <Clock className="w-4 h-4 text-gray-400" title="Nylig besøkt" />
                      )}
                      {index === 0 && !isCurrent && (
                        <Star className="w-4 h-4 text-yellow-500" title="Anbefalt" />
                      )}
                    </div>

                    {project.prosjektnummer && (
                      <p className="text-sm text-gray-600 truncate">
                        {project.prosjektnummer}
                      </p>
                    )}
                  </div>

                  {/* Project Icon */}
                  <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      {currentProjectId && (
        <div className="bg-blue-50 border-l-4 border-sky-600 p-4 text-sm text-gray-700">
          <p>
            💡 Ditt nåværende prosjekt vises øverst, men kan ikke velges som mål.
            Nylig besøkte prosjekter vises deretter.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={onCancel}
        >
          Avbryt
        </Button>
        <Button
          onClick={handleSelect}
          disabled={!selectedProjectId}
          className="bg-sky-600 hover:bg-sky-700 text-white"
        >
          Neste →
        </Button>
      </div>
    </div>
  );
};
