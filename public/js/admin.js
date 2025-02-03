const deleteProduct = async (btn) => {
  const productId = btn.parentNode.querySelector('[name=productId').value;
  const productElement = btn.closest('article');

  await fetch(`/admin/product/${productId}`, {
    method: 'DELETE',
  });

  productElement.remove();
};

const button = document.querySelector('button');

button.addEventListener('click', deleteProduct);
