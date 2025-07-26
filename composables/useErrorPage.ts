/**
 * Composable for handling error page redirections with custom parameters
 */
export const useErrorPage = () => {
  const router = useRouter()

  /**
   * Redirect to the error page with custom parameters
   */
  const redirectToError = (options: {
    title?: string
    message?: string
    buttonText?: string
    buttonLink?: string
    buttonIcon?: string
  }) => {
    const query: Record<string, string> = {}
    
    if (options.title) query.title = options.title
    if (options.message) query.message = options.message
    if (options.buttonText) query.buttonText = options.buttonText
    if (options.buttonLink) query.buttonLink = options.buttonLink
    if (options.buttonIcon) query.buttonIcon = options.buttonIcon

    return router.push({
      path: '/404',
      query
    })
  }

  /**
   * Redirect to 404 page with default "Page Not Found" message
   */
  const redirectTo404 = () => {
    return router.push('/404')
  }

  /**
   * Redirect to error page for API/data fetch errors
   */
  const redirectToDataError = (customMessage?: string) => {
    return redirectToError({
      title: 'Data Load Error',
      message: customMessage || 'Failed to load the requested data. Please check your connection and try again.',
      buttonText: 'Try Again',
      buttonLink: '/',
      buttonIcon: 'pi pi-refresh'
    })
  }

  /**
   * Redirect to error page for permission/access errors
   */
  const redirectToAccessError = () => {
    return redirectToError({
      title: 'Access Denied',
      message: 'You do not have permission to access this page. Please contact an administrator if you believe this is an error.',
      buttonText: 'Go to Home',
      buttonLink: '/',
      buttonIcon: 'pi pi-home'
    })
  }

  /**
   * Redirect to error page for maintenance mode
   */
  const redirectToMaintenance = () => {
    return redirectToError({
      title: 'Under Maintenance',
      message: 'This feature is currently under maintenance. Please check back later.',
      buttonText: 'Go to Home',
      buttonLink: '/',
      buttonIcon: 'pi pi-home'
    })
  }

  return {
    redirectToError,
    redirectTo404,
    redirectToDataError,
    redirectToAccessError,
    redirectToMaintenance
  }
}
