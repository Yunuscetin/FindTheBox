# Yesil Kutuyu Bul

Bu proje, tarayicida oynanan cok oyunculu bir lobi oyunu olarak hazirlandi.

## Ozellikler

- Ana sayfada `Oyun Kur` ve `Oyuna Katil` akisi
- Oda sahibi icin 6 haneli oda kodu ve paylasilabilir davet linki
- Tarayiciya ilk kez giren oyuncudan isim alma
- Maksimum 4 kisilik lobi
- 5 steplik turnuva akisi: 100, 80, 60, 50 ve 40 kutu
- Step kazananina sonraki stepte ilk baslama avantaji
- 2, 3 ve 4. steplerde 5 acilis hakki, 5. stepte 3 acilis hakki
- Kirmizi kutularin ustunde tiklayan oyuncunun bas harfleri
- Step sonuclari ve lider tablosu
- Turnuva sonunda en cok step kazanan oyuncunun lider ilan edilmesi

## Yerelde calistirma

Python 3 kuruluysa proje klasorunde terminal acip su komutu calistir:

```bash
python server.py
```

Ardindan tarayicida su adresi ac:

```text
http://127.0.0.1:8000
```

## Notlar

- Oda verileri artik yerelde [game.db](C:\Users\YUNUS NUR\Documents\New project\game.db) icinde SQLite olarak tutulur.
- Host ayrilirsa lobi otomatik olarak siradaki oyuncuya devredilir.
- Uzun sure pasif kalan oyuncular ve odalar otomatik temizlenir.
- Canliya alirken HTTPS, ters proxy, process manager ve domain baglantisi eklenmesi yeterli olur.
