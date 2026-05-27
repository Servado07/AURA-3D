import os
import re

DIRECTORIO_ACTUAL = os.path.dirname(os.path.abspath(__file__))
ARCHIVO_CATALOGO = os.path.join(DIRECTORIO_ACTUAL, "catalogo.html")

class Colores:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def leer_archivo():
    if not os.path.exists(ARCHIVO_CATALOGO):
        print(f"\n{Colores.FAIL}❌ ERROR CRÍTICO:{Colores.ENDC}")
        print(f"No encuentro el archivo en: {ARCHIVO_CATALOGO}")
        return None
    with open(ARCHIVO_CATALOGO, "r", encoding="utf-8") as f:
        return f.read()

def guardar_archivo(contenido):
    with open(ARCHIVO_CATALOGO, "w", encoding="utf-8") as f:
        f.write(contenido)
    print(f"\n{Colores.GREEN}✅ Cambios guardados correctamente en catalogo.html{Colores.ENDC}")

def buscar_cierre_tag(texto, inicio, tag="div"):
    contador = 0
    encontrado_primero = False
    tag_apertura = f"<{tag}"
    tag_cierre = f"</{tag}>"
    
    for i in range(inicio, len(texto)):
        if texto[i:i+len(tag_apertura)] == tag_apertura:
            contador += 1
            encontrado_primero = True
        elif texto[i:i+len(tag_cierre)] == tag_cierre:
            contador -= 1
        
        if encontrado_primero and contador == 0:
            return i + len(tag_cierre)
    return -1

def generar_html_producto(tag_display, titulo, descripcion, imagenes, link_walla, link_vinted, link_cults):
    botones_nav = ""
    if len(imagenes) > 1:
        botones_nav = """
          <button class="carousel-btn prev">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="carousel-btn next">
            <i class="fas fa-chevron-right"></i>
          </button>"""

    imgs_html = ""
    for i, img_path in enumerate(imagenes):
        active_class = " active" if i == 0 else ""
        imgs_html += f'          <img src="{img_path}" class="carousel-slide{active_class}" alt="{titulo} {i+1}" />\n'

    return f"""
      <div class="product-card fade-in">
        <div class="product-image carousel-container">
{botones_nav}
{imgs_html}        </div>
        <div class="product-content">
          <span class="tag">{tag_display}</span>
          <h3>{titulo}</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem">
            {descripcion}
          </p>
          <div class="btn-group">
            <div class="buy-wrapper">
              <button class="btn-outline buy-trigger">
                <i class="fas fa-shopping-bag"></i> Comprar
              </button>
              <div class="platform-options">
                <a href="{link_walla}" target="_blank" class="btn-platform btn-wallapop">Wallapop</a>
                <a href="{link_vinted}" target="_blank" class="btn-platform btn-vinted">Vinted</a>
              </div>
            </div>
            <a href="{link_cults}" class="btn-outline cults"><i class="fas fa-download"></i> STL</a>
          </div>
        </div>
      </div>"""

def subir_articulo():
    print(f"\n{Colores.HEADER}--- 🚀 MODO SUBIR ARTÍCULO ---{Colores.ENDC}")
    contenido = leer_archivo()
    if not contenido: return

    secciones = re.findall(r'<section id="([^"]+)"', contenido)
    
    print(f"\n{Colores.BLUE}Selecciona la categoría:{Colores.ENDC}")
    for i, sec in enumerate(secciones):
        print(f"{i+1}. {sec.capitalize()}")
    
    opcion = input(f"👉 Elige una opción (1-{len(secciones)}): ").strip()
    
    if not opcion.isdigit() or int(opcion) < 1 or int(opcion) > len(secciones):
        print("❌ Opción no válida.")
        return

    categoria_slug = secciones[int(opcion)-1]
    target_id = f'id="{categoria_slug}"'
    
    match_h2 = re.search(f'{target_id}.*?<h2>(.*?)</h2>', contenido, re.DOTALL)
    tag_display = match_h2.group(1).split(" ")[0] if match_h2 else categoria_slug.capitalize()

    titulo = input("\n📝 Título del producto: ")
    descripcion = input("📝 Descripción corta: ")

    print(f"\n🖼️  {Colores.BOLD}Añadir imágenes{Colores.ENDC} (Escribe 'fin' para terminar)")
    imagenes = []
    while True:
        ruta_raw = input(f"   Ruta imagen {len(imagenes) + 1}: ").strip()
        ruta = ruta_raw.replace('\\', '/')
        if ruta.lower() == 'fin':
            if len(imagenes) == 0:
                print("⚠️ Debes poner al menos una imagen.")
                continue
            break
        imagenes.append(ruta)

    print(f"\n🔗 {Colores.BOLD}Enlaces de compra:{Colores.ENDC}")
    link_walla = input("   Wallapop URL: ")
    link_vinted = input("   Vinted URL: ")
    link_cults = input("   Cults3D URL: ")

    html_card = generar_html_producto(tag_display, titulo, descripcion, imagenes, link_walla, link_vinted, link_cults)

    pos_seccion = contenido.find(target_id)
    pos_grid = contenido.find('<div class="grid-3">', pos_seccion)
    
    if pos_grid == -1: return print("❌ Error: Estructura HTML no esperada.")
    
    punto_insercion = pos_grid + 20 
    contenido_final = contenido[:punto_insercion] + "\n" + html_card + contenido[punto_insercion:]
    guardar_archivo(contenido_final)

def listar_productos(contenido):
    patron_inicio = r'<div class="product-card fade-in">'
    productos = []
    
    for match in re.finditer(patron_inicio, contenido):
        inicio_idx = match.start()
        fin_idx = buscar_cierre_tag(contenido, inicio_idx, "div")
        
        if fin_idx != -1:
            bloque = contenido[inicio_idx:fin_idx]
            match_titulo = re.search(r'<h3>(.*?)</h3>', bloque)
            titulo = match_titulo.group(1) if match_titulo else "Sin título"
            
            parte_anterior = contenido[:inicio_idx]
            secciones = list(re.finditer(r'<section id="([^"]+)"', parte_anterior))
            categoria = secciones[-1].group(1) if secciones else "Desconocida"

            productos.append({
                'indice': len(productos) + 1,
                'titulo': titulo,
                'categoria': categoria,
                'inicio': inicio_idx,
                'fin': fin_idx,
                'html': bloque
            })
    return productos

def borrar_articulo():
    print(f"\n{Colores.HEADER}--- 🗑️ MODO BORRAR ARTÍCULO ---{Colores.ENDC}")
    contenido = leer_archivo()
    if not contenido: return

    productos = listar_productos(contenido)
    if not productos: return print("❌ No hay productos.")

    print(f"\n{Colores.BLUE}Productos encontrados:{Colores.ENDC}")
    print(f"{'#':<4} {'CATEGORÍA':<15} {'TÍTULO'}")
    print("-" * 50)
    for p in productos:
        print(f"{p['indice']:<4} {p['categoria']:<15} {p['titulo']}")

    sel = input(f"\n👉 Número a borrar (0 cancelar): ").strip()
    if not sel.isdigit() or int(sel) == 0: return
    
    idx = int(sel) - 1
    if 0 <= idx < len(productos):
        prod = productos[idx]
        print(f"Borrando: {prod['titulo']}...")
        nuevo_contenido = contenido[:prod['inicio']] + contenido[prod['fin']:]
        guardar_archivo(nuevo_contenido)
    else:
        print("❌ Número incorrecto.")

def modificar_producto():
    print(f"\n{Colores.HEADER}--- ✏️ MODO MODIFICAR PRODUCTO ---{Colores.ENDC}")
    contenido = leer_archivo()
    if not contenido: return

    productos = listar_productos(contenido)
    if not productos: return print("❌ No hay productos.")

    print(f"\n{Colores.BLUE}Selecciona producto a editar:{Colores.ENDC}")
    for p in productos:
        print(f"{p['indice']:<4} {p['categoria']:<15} {p['titulo']}")

    sel = input(f"\n👉 Número (0 cancelar): ").strip()
    if not sel.isdigit() or int(sel) == 0: return
    idx = int(sel) - 1
    
    if idx < 0 or idx >= len(productos): return print("❌ Error.")
    
    prod = productos[idx]
    html_old = prod['html']

    titulo_actual = re.search(r'<h3>(.*?)</h3>', html_old).group(1)
    desc_actual = re.search(r'<p.*?>(.*?)</p>', html_old, re.DOTALL).group(1).strip()
    tag_actual = re.search(r'<span class="tag">(.*?)</span>', html_old).group(1)
    
    link_w_match = re.search(r'href="(.*?)"[^>]*class="[^"]*btn-wallapop"', html_old)
    link_w_actual = link_w_match.group(1) if link_w_match else ""
    
    link_v_match = re.search(r'href="(.*?)"[^>]*class="[^"]*btn-vinted"', html_old)
    link_v_actual = link_v_match.group(1) if link_v_match else ""
    
    link_c_match = re.search(r'href="(.*?)"[^>]*class="[^"]*cults"', html_old)
    link_c_actual = link_c_match.group(1) if link_c_match else ""

    imgs_actual = re.findall(r'<img src="(.*?)"', html_old)

    categoria_slug_actual = prod['categoria']
    categoria_slug_nueva = categoria_slug_actual
    tag_nuevo = tag_actual

    while True:
        print(f"\n{Colores.CYAN}--- ¿Qué deseas modificar? ---{Colores.ENDC}")
        print(f"1. Título (Actual: {titulo_actual})")
        print(f"2. Descripción (Actual: {desc_actual[:25]}...)")
        print(f"3. Categoría (Actual: {categoria_slug_actual})")
        print(f"4. Imágenes (Actual: {len(imgs_actual)} imágenes)")
        print(f"5. Enlaces")
        print(f"6. 💾 Guardar cambios y salir")
        print(f"7. ❌ Cancelar")
        
        opcion = input("\n👉 Elige una opción: ").strip()
        
        if opcion == "1":
            titulo_actual = input(f"📝 Nuevo Título [{titulo_actual}]: ").strip() or titulo_actual
        elif opcion == "2":
            desc_actual = input(f"📝 Nueva Descripción [{desc_actual[:25]}...]: ").strip() or desc_actual
        elif opcion == "3":
            secciones = re.findall(r'<section id="([^"]+)"', contenido)
            print(f"\n{Colores.BLUE}Selecciona la nueva categoría:{Colores.ENDC}")
            for i, sec in enumerate(secciones):
                print(f"{i+1}. {sec.capitalize()}")
            opc_cat = input(f"👉 Elige una opción (1-{len(secciones)}): ").strip()
            
            if opc_cat.isdigit() and 1 <= int(opc_cat) <= len(secciones):
                categoria_slug_nueva = secciones[int(opc_cat)-1]
                target_id = f'id="{categoria_slug_nueva}"'
                match_h2 = re.search(f'{target_id}.*?<h2>(.*?)</h2>', contenido, re.DOTALL)
                tag_nuevo = match_h2.group(1).split(" ")[0] if match_h2 else categoria_slug_nueva.capitalize()
                print(f"{Colores.GREEN}✅ Categoría cambiada a {categoria_slug_nueva}{Colores.ENDC}")
            else:
                print("❌ Opción no válida.")
        elif opcion == "4":
            print(f"\n🖼️  Imágenes actuales: {len(imgs_actual)}")
            imgs_temp = []
            print("   (Escribe 'fin' para terminar)")
            while True:
                ruta = input(f"   Ruta imagen {len(imgs_temp) + 1}: ").strip().replace('\\', '/')
                if ruta == 'fin': break
                imgs_temp.append(ruta)
            if imgs_temp: 
                imgs_actual = imgs_temp
        elif opcion == "5":
            link_w_actual = input(f"   Wallapop [{link_w_actual[:20]}...]: ").strip() or link_w_actual
            link_v_actual = input(f"   Vinted [{link_v_actual[:20]}...]: ").strip() or link_v_actual
            link_c_actual = input(f"   Cults3D [{link_c_actual[:20]}...]: ").strip() or link_c_actual
        elif opcion == "6":
            break
        elif opcion == "7":
            print(f"{Colores.WARNING}❌ Modificación cancelada.{Colores.ENDC}")
            return
        else:
            print("❌ Opción incorrecta.")

    html_new = generar_html_producto(tag_nuevo, titulo_actual, desc_actual, imgs_actual, link_w_actual, link_v_actual, link_c_actual)

    if categoria_slug_nueva == categoria_slug_actual:
        nuevo_global = contenido[:prod['inicio']] + html_new + contenido[prod['fin']:]
    else:
        contenido_sin_viejo = contenido[:prod['inicio']] + contenido[prod['fin']:]
        target_id = f'id="{categoria_slug_nueva}"'
        pos_seccion = contenido_sin_viejo.find(target_id)
        
        if pos_seccion == -1: return print("❌ Error: No se encontró la nueva sección.")
        
        pos_grid = contenido_sin_viejo.find('<div class="grid-3">', pos_seccion)
        if pos_grid == -1: return print("❌ Error: Estructura HTML no esperada en la nueva sección.")
        
        punto_insercion = pos_grid + 20 
        nuevo_global = contenido_sin_viejo[:punto_insercion] + "\n" + html_new + contenido_sin_viejo[punto_insercion:]

    guardar_archivo(nuevo_global)

def anadir_seccion():
    print(f"\n{Colores.HEADER}--- ✨ AÑADIR NUEVA SECCIÓN ---{Colores.ENDC}")
    contenido = leer_archivo()
    if not contenido: return

    nombre = input("📝 Nombre de la Categoría (ej: Llaveros): ").strip()
    slug = nombre.lower().replace(" ", "-")  
    icono = input("🎨 Icono FontAwesome (ej: fas fa-star): ").strip() or "fas fa-cube"

    if f'id="{slug}"' in contenido:
        print("❌ Ya existe una sección con ese nombre.")
        return

    nuevo_li = f"""
          <li>
            <a href="#{slug}"><i class="{icono}"></i> {nombre}</a>
          </li>"""

    patron_nav = r'(<nav class="category-nav.*?<ul>)(.*?)(</ul>)'
    match_nav = re.search(patron_nav, contenido, re.DOTALL)

    if not match_nav:
        print("❌ No encuentro el menú de categorías.")
        return

    contenido_con_nav = (
        contenido[:match_nav.start(3)] +
        nuevo_li +
        "\n        " +
        contenido[match_nav.start(3):]
    )

    pos_footer = contenido_con_nav.find('<footer>')
    if pos_footer == -1:
        print("❌ No encuentro el footer.")
        return

    nueva_seccion_html = f"""
  <section id="{slug}" class="catalog-section container">
    <div class="section-header fade-in" style="text-align: left; margin-bottom: 2rem; margin-top: 3rem">
      <h2>{nombre}</h2>
    </div>
    <div class="grid-3">
      <p style="color: var(--text-secondary)">
        Próximamente productos en {nombre}...
      </p>
    </div>
  </section>

"""

    contenido_final = (
        contenido_con_nav[:pos_footer] +
        nueva_seccion_html +
        contenido_con_nav[pos_footer:]
    )

    guardar_archivo(contenido_final)

def borrar_seccion():
    print(f"\n{Colores.HEADER}--- ❌ BORRAR SECCIÓN ---{Colores.ENDC}")
    contenido = leer_archivo()
    if not contenido: return

    secciones = re.findall(r'<section id="([^"]+)"', contenido)
    if not secciones: return print("No hay secciones.")

    print(f"\n{Colores.WARNING}⚠️  ¡CUIDADO! Esto borrará la categoría y TODOS sus productos.{Colores.ENDC}")
    for i, sec in enumerate(secciones):
        print(f"{i+1}. {sec}")

    sel = input(f"\n👉 Elige sección a eliminar (0 cancelar): ").strip()
    if not sel.isdigit() or int(sel) == 0: return
    
    slug = secciones[int(sel)-1]

    inicio_sec = contenido.find(f'<section id="{slug}"')
    if inicio_sec == -1: return print("Error al buscar sección.")
    
    fin_sec = buscar_cierre_tag(contenido, inicio_sec, "section")
    if fin_sec == -1: return print("Error calculando cierre de sección.")

    contenido_sin_body = contenido[:inicio_sec] + contenido[fin_sec:]

    patron_li = re.compile(f'<li>\s*<a href="#{slug}".*?</li>', re.DOTALL)
    
    contenido_final = re.sub(patron_li, '', contenido_sin_body)
    
    guardar_archivo(contenido_final)

def main():
    while True:
        print("\n" + "="*45)
        print(f"{Colores.BOLD}🤖  CMS AURA 3D v3.0  🤖{Colores.ENDC}")
        print("="*45)
        print(f"{Colores.GREEN}1. 📤 Subir Artículo Nuevo{Colores.ENDC}")
        print(f"{Colores.CYAN}2. ✏️  Modificar Producto Existente{Colores.ENDC}")
        print(f"{Colores.FAIL}3. 🗑️  Borrar Artículo{Colores.ENDC}")
        print("-" * 20)
        print(f"{Colores.GREEN}4. ✨ Añadir Nueva Categoría/Sección{Colores.ENDC}")
        print(f"{Colores.FAIL}5. ❌ Borrar Categoría/Sección Completa{Colores.ENDC}")
        print("-" * 20) 
        print("6. 🚪 Salir")
        
        opcion = input("\n👉 Elige una opción: ").strip()
        
        if opcion == "1": subir_articulo()
        elif opcion == "2": modificar_producto()
        elif opcion == "3": borrar_articulo()
        elif opcion == "4": anadir_seccion()
        elif opcion == "5": borrar_seccion()
        elif opcion == "6": break
        else: print("❌ Opción incorrecta")

if __name__ == "__main__":
    main()