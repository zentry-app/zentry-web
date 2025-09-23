# Solución: Error "Firebase Admin no está configurado correctamente"

## Problema
Después del commit `e33b674e` que cambió la configuración de Firebase Admin, aparecía el error:
```
Error: Firebase Admin no está configurado correctamente
```

## Causa raíz
1. El commit `e33b674e` cambió el nombre de la variable de entorno de `FIREBASE_SERVICE_ACCOUNT_KEY` a `FIREBASE_SERVICE_ACCOUNT`
2. El archivo `.env.local` tenía el JSON de credenciales en múltiples líneas, causando problemas de parsing en Next.js

## Solución implementada
Se configuraron las variables de entorno individuales en lugar del JSON completo:

```bash
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=zentryapp-949f4
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-gajfy@zentryapp-949f4.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDEBn0uJ+17X6/h\n1Zz10jWLe8nkKHK6HsmZqMtrU1SAt2hPXfv7kkpwvLM7jvCX7tzJUQ79eKXWGb7Q\nurjfQ7A0sHsIFVi3TG8BoPbJXEqo6Etf3BSm6/i5ar9DJZeX4Yzf6smTkZVaJH9v\np3Pv585DZgfiUNBi1NMZqJSCjDKdxrc20VR4dxnKW0l+h1XS5afoc/gcMdAkUKj+\nVfTAlLrr/+FQFwxI3BHf9ZApD2pHNkO2ZPsRcuMrH2xW8zlZKH2o7UKpvgsxjfJ5\nKs6z5/ptrf1OZtwZ3NLgVYqgjobYNeePaf7wvZeLBU3NsvwheJJBJxtR76WiSIxN\njzslmLzZAgMBAAECggEAEn8qQLizx/h3eC/X57o2IztDCaxnZviQvVcYGsB6MMsd\npJ+Rr2NWctzbbLtIKI35d2WWrIQ94b38K2XzG94fOlmMwm6BOIqVzumJX+a9hMKm\nmh0CNd3+UkCoW4WokERQLrDQ5IPQO/lFrRt37SNKa0GtbMWDZFAAu2MU4FyqSgjT\nwm8NYNnc5REtrXmCfAVziV8fc8S+/1/zKAdTloQTXRLybSTyri0wK9ak54Kl0mQQ\nreUJ5zNkQrx4aEKL+TtGn1Sl9o203ai0N+tJRrYaklalxsPg4xR5SOPtv5VnOlLN\njAuZcQAyNZaBmk1tdJwSLz+hrj1VLPZSFtYuCgwgAQKBgQDNm5QnrL+O6oZ1/IOl\njXTNJNDZuevZVQqf0Tv6Fik1ZCwK8bklY8/eaH/9D4S0TDWneLW9ecttF8c1iRNa\nYQatvDzSw28EQJlDSgIdJNjuTIh4+N4tORhvl+J6RYnakteKbaVW0/vx+wFja0S3\nHy3pJpansnAsaXzdTzstNjcJWQKBgQD0Ea8blBxQTN5RFG2qvlK8WDnFLXE72uiK\nAUiGgwYag0LNbE1ZrxI7Co0OtI0juQUepMZubl51fZ9JfEhZBGqtX82xVxaV3td2\nhvEBnvsfpo99J8NQ3eVTKhi1d7NAplHIz+uCKu3kPy2tahaEgrmnpEJBX0pYAlZ8\ncOeOwO1fgQKBgQDLMFsDsmZEWGS1KOz4qIirSxzSbjgzuSUct2vsRAZJa0tTLXrp\nBnCgvOjvL2zXuRC1Bkekjj6I+xy1PVfQ014ER6hcKSMHMsfDhdn87zMqnJup4Ve/\nnVMWxSTd7ObFCKTVenIREsFDa+j9VT69MaTvamEsLN1KJp1tICW9EnzlUQKBgQDx\nkQMwl6KCc+Jie4ajxSYcVnIvT2/QnzUjSmve/pWu7hXTPgs85cN0flfooxlCryB7\nGPlxWXnSbdiXIhR1TqLLIJR0ns6y3VGCdcLaKOFCjVddt1pgko8khfjYuzXGmhc+\nW1QsjJLSIxnxlpvc4Yohe7k7/LWXcBDrr8/wAdGvgQKBgQCGkQLaGN9xXO1pwcNw\ny+MBh+iGcuNW82Qj6XVIZCwC3iLhLD2TXiW/3Z70BeE3csEP9ZX5rcrpsvMUIIuG\nHuANa79bjc5f0WQ2NHJMpN626GNMg2DfYclUPNrlwSqWQpuZCJLGuFs8d42Zi1Td\nngsdGM+WcnGM7E10AVG8Nibl3w==\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=zentryapp-949f4.appspot.com

# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAPKpz9Twt_n8Zgkk8mh4cFNuo4SipwG5c
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zentryapp-949f4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zentryapp-949f4
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=zentryapp-949f4.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=905646843025
NEXT_PUBLIC_FIREBASE_APP_ID=1:905646843025:web:9b23d5c6d6d6c78f93cb30
```

## Verificación
Después de aplicar la solución:
- ✅ Firebase Admin SDK se inicializa correctamente
- ✅ Los endpoints de tags funcionan sin el error de configuración
- ✅ El servidor responde correctamente a las peticiones

## Prevención futura
Para evitar este problema en el futuro:
1. Siempre usar variables de entorno individuales en lugar de JSON completo
2. Verificar que las variables estén en una sola línea
3. Reiniciar el servidor después de cambios en variables de entorno
4. Probar los endpoints después de cambios de configuración

## Archivos modificados
- `.env.local` - Configuración de variables de entorno corregida
- `.env.local.backup2` - Respaldo de la configuración anterior

---
**Fecha de resolución:** $(date)
**Commit relacionado:** e33b674e - "fix: Unificar inicialización Firebase Admin SDK y agregar healthcheck endpoint"
