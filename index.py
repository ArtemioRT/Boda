import psycopg2
from psycopg2 import sql

# Configuración de la conexión
DB_CONFIG = {
    "host": "dpg-d37c2a3e5dus73983tdg-a.virginia-postgres.render.com",
    "port": 5432,
    "dbname": "boda_elva",
    "user": "boda_elva_user",
    "password": "5ZWx9YFzLJr8gHemY4AYM1MlyXMtuyWH",
    "sslmode": "require"
}

def delete_all_photos():
    try:
        # Conexión a la base de datos
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Ejecutar el DELETE
        cur.execute(sql.SQL("DELETE FROM wedding_photos RETURNING id;"))
        deleted_rows = cur.fetchall()

        conn.commit()

        print(f"🗑️ {len(deleted_rows)} fotos eliminadas de la base de datos.")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error al eliminar las fotos: {e}")

if __name__ == "__main__":
    confirm = input("⚠️ Esto borrará TODAS las fotos. ¿Estás seguro? (escribe 'SI' para continuar): ")
    if confirm.upper() == "SI":
        delete_all_photos()
    else:
        print("Operación cancelada.")
