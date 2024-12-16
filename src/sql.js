 const ListMarcas = `SELECT 
    m.idMarca, 
    m.nombreMarca AS Marca, 
    COUNT(p.idProducto) AS CantidadProductos
FROM 
    marcas m
LEFT JOIN 
    productos p 
ON 
    m.idMarca = p.idMarca
    WHERE 
    m.estado = true
GROUP BY 
    m.idMarca, m.nombreMarca;`

const ListCategorias = `SELECT * from  categorias`

module.exports = {ListMarcas, ListCategorias}