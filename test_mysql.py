import pymysql

usernames = ['root', 'admin', 'vault_user', 'mysql']
passwords = ['', 'root', 'admin', 'password', '123456', '1234', '12345', '12345678', 'root@123', 'Admin@123', 'Password123!', 'mysql', 'root123']

found = False
for u in usernames:
    for pwd in passwords:
        try:
            conn = pymysql.connect(host='127.0.0.1', user=u, password=pwd, port=3306, connect_timeout=1)
            print(f'SUCCESS! Connected as user: "{u}", password: "{pwd}"')
            cursor = conn.cursor()
            cursor.execute("SHOW DATABASES;")
            print("Databases:", [r[0] for r in cursor.fetchall()])
            conn.close()
            found = True
            break
        except Exception as e:
            pass
    if found:
        break

if not found:
    print('No standard credentials matched. Configure DB settings in config.py.')
