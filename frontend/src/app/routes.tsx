import { PlaceholderPage } from '../pages/foundation/ui/PlaceholderPage'
import { NotFoundPage } from '../pages/not-found/ui/NotFoundPage'
import { DashboardPage } from '../pages/dashboard/ui/DashboardPage'
import { AppsPage } from '../pages/apps/ui/AppsPage'
import { AppDetailsPage } from '../pages/apps/ui/AppDetailsPage'
import { AppEditPage } from '../pages/apps/ui/AppEditPage'
import { DeploymentsPage } from '../pages/deployments/ui/DeploymentsPage'
import { DeploymentDetailsPage } from '../pages/deployments/ui/DeploymentDetailsPage'
import { RepositoriesPage } from '../pages/repositories/ui/RepositoriesPage'
import { RepositoryDetailsPage } from '../pages/repositories/ui/RepositoryDetailsPage'
import { RepositoryEditPage } from '../pages/repositories/ui/RepositoryEditPage'
import { LoginPage } from '../features/auth/ui/LoginPage'
import type { AppRoute } from './router'

export const routes: AppRoute[] = [
  {
    path: '/login',
    label: 'Login',
    description: 'Logowanie administratora do control plane.',
    icon: 'login',
    public: true,
    element: <LoginPage />,
  },
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
    description: 'Lista aplikacji w stylu cockpit z metrykami, filtrami i tabela serwisow.',
    icon: 'apps',
    section: 'primary',
    element: <AppsPage />,
  },
  {
    path: '/apps/create',
    label: 'Create App',
    description: 'Osobny ekran tworzenia aplikacji.',
    icon: 'apps',
    nav: false,
    element: <AppEditPage />,
  },
  {
    path: '/apps/:appId',
    label: 'App Details',
    description: 'Szczegoly aplikacji w ukladzie overview.',
    icon: 'apps',
    nav: false,
    element: <AppDetailsPage />,
  },
  {
    path: '/apps/:appId/edit',
    label: 'Edit App',
    description: 'Pelny ekran edycji aplikacji.',
    icon: 'apps',
    nav: false,
    element: <AppEditPage />,
  },
  {
    path: '/deployments',
    label: 'Deployments',
    description: 'Historia wdrozen i podglad statusow.',
    icon: 'rocket_launch',
    section: 'primary',
    element: <DeploymentsPage />,
  },
  {
    path: '/deployments/:appId/:deploymentId',
    label: 'Deployment Details',
    description: 'Szczegoly pojedynczego deploymentu.',
    icon: 'rocket_launch',
    nav: false,
    element: <DeploymentDetailsPage />,
  },
  {
    path: '/repositories',
    label: 'Repos',
    description: 'Lista repozytoriow i mapowan GitHub dla aplikacji.',
    icon: 'source',
    section: 'primary',
    element: <RepositoriesPage />,
  },
  {
    path: '/repositories/create',
    label: 'Create Repository',
    description: 'Osobny ekran dodawania repozytorium.',
    icon: 'source',
    nav: false,
    element: <RepositoryEditPage />,
  },
  {
    path: '/repositories/:appId',
    label: 'Repository Details',
    description: 'Podglad mapowania repozytorium dla wybranej aplikacji.',
    icon: 'source',
    nav: false,
    element: <RepositoryDetailsPage />,
  },
  {
    path: '/repositories/:appId/edit',
    label: 'Edit Repository',
    description: 'Pelny ekran edycji repozytorium.',
    icon: 'source',
    nav: false,
    element: <RepositoryEditPage />,
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
