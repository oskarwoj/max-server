const get404 = (req, res) =>
  res.status(404).render('404', {
    pageTitle: 'Page Not Found',
    path: '/404',
    isAuthenticated: req.user,
  });

const get500 = (req, res) => {
  res.render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.user,
  });
};
export const errorController = {
  get404,
  get500,
};
