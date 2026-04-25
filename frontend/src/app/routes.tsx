import { PlaceholderPage } from '../pages/foundation/ui/PlaceholderPage'
import { NotFoundPage } from '../pages/not-found/ui/NotFoundPage'
import { DashboardPage } from '../pages/dashboard/ui/DashboardPage'
import type { AppRoute } from './router'

export const routes: AppRoute[] = [
  {
    path: '/',
    label: 'Dashboard',
    description: 'Przeglad platformy i aktywnosci control plane.',
    icon: 'dashboard',
    section: 'primary',
    element: <DashboardPage />,
  },
  {
    path: '/apps',
    label: 'Apps',
    description: 'Lista aplikacji i miejsce pod CRUD w Etapie 5.',
    icon: 'apps',
    section: 'primary',
    element: (
      <PlaceholderPage
        eyebrow="Etap 5"
        title="Zarzadzanie aplikacjami"
        description="Shell jest gotowy na liste aplikacji, filtry i widok szczegolow. Na razie to bezpieczny placeholder osadzony w docelowym layoucie."
        highlights={['Lista aplikacji', 'Filtry i wyszukiwarka', 'Metadane i statusy']}
      />
    ),
  },
  {
    path: '/deployments',
    label: 'Deployments',
    description: 'Historia wdrozen i podglad statusow.',
    icon: 'rocket_launch',
    section: 'primary',
    element: (
      <PlaceholderPage
        eyebrow="Etap 7"
        title="Deployments"
        description="Miejsce na liste deploymentow, szczegoly wykonania i reczny trigger wdrozen."
        highlights={['Historia deploymentow', 'Status commitow', 'Logi i retry']}
      />
    ),
  },
  {
    path: '/repositories',
    label: 'Repos',
    description: 'Konfiguracja repozytoriow i webhookow.',
    icon: 'source',
    section: 'primary',
    element: (
      <PlaceholderPage
        eyebrow="Etap 6"
        title="Repozytoria"
        description="Ten widok przygotowuje routing i przestrzen pod podpiecie GitHuba oraz branch deployujacy."
        highlights={['Owner / repo / branch', 'Webhooki', 'Ostatni commit']}
      />
    ),
  },
  {
    path: '/environment',
    label: 'Env Vars',
    description: 'Zarzadzanie zmiennymi srodowiskowymi i sekretami.',
    icon: 'variables',
    section: 'primary',
    element: (
      <PlaceholderPage
        eyebrow="Etap 9"
        title="Zmienne srodowiskowe"
        description="Uklad jest gotowy pod liste zmiennych, maskowanie sekretow i formularze edycyjne."
        highlights={['Sekrety i zwykle wartosci', 'Walidacja kluczy', 'Usuwanie i edycja']}
      />
    ),
  },
  {
    path: '/domains',
    label: 'Domains',
    description: 'Konfiguracja domen i routingu aplikacji.',
    icon: 'domain',
    section: 'primary',
    element: (
      <PlaceholderPage
        eyebrow="Etap 10"
        title="Domeny"
        description="Shell obsluguje juz trasowanie i not-found, wiec mozna bezpiecznie dodac workflow domen w kolejnych etapach."
        highlights={['Domena glowna', 'Status konfiguracji', 'Walidacja konfliktow']}
      />
    ),
  },
  {
    path: '/runtime',
    label: 'Runtime',
    description: 'Operacje start, stop, restart i healthcheck.',
    icon: 'memory',
    section: 'primary',
    element: (
      <PlaceholderPage
        eyebrow="Etap 8"
        title="Runtime"
        description="Ten placeholder przewiduje operacje runtime bez laczenia jeszcze z backendem."
        highlights={['Start / stop / restart', 'Healthcheck', 'Potwierdzenia akcji']}
      />
    ),
  },
  {
    path: '/foundation',
    label: 'Foundation',
    description: 'Przeglad bazowych komponentow UI dla kolejnych etapow.',
    icon: 'deployed_code',
    section: 'secondary',
    element: (
      <PlaceholderPage
        eyebrow="Etap 2"
        title="Foundation"
        description="Widok referencyjny dla wspolnych komponentow i rytmu layoutu panelu administracyjnego."
        highlights={['Karty i badge', 'Page header', 'Przyciski i puste stany']}
      />
    ),
  },
  {
    path: '/settings',
    label: 'Settings',
    description: 'Konfiguracja panelu i sesji administratora.',
    icon: 'settings',
    section: 'secondary',
    element: (
      <PlaceholderPage
        eyebrow="Nastepne kroki"
        title="Ustawienia"
        description="Topbar pokazuje juz informacje o sesji. Ten ekran zostal zarezerwowany pod ustawienia panelu i akcje administratora."
        highlights={['Sesja administratora', 'Konfiguracja panelu', 'Preferencje operatora']}
      />
    ),
  },
  {
    path: '/404',
    label: 'Not Found',
    description: 'Fallback dla nieistniejacych tras.',
    icon: 'warning',
    section: 'secondary',
    element: <NotFoundPage />,
  },
]
