<!--
Retrieval profiles: common symptoms and reasons to visit, per specialty (document expansion).
The admin-written specialty descriptions in MySQL are ~30 words, far too few for retrieval; these
profiles are used ONLY for AI retrieval and are not shown on the website.

Rules for editing (to keep the eval honest):
* general symptom vocabulary only, in lay and medical terms; no slang or phrasings copied from eval/data
* changes may be motivated by DEV-split failures only; the TEST split is for reporting
* "## " heading = specialty name exactly as in the database; each "- " line = one phrase group
-->

## Tim mạch
- đau ngực, tức ngực khi gắng sức, đau thắt ngực, đau ngực lan lên vai
- hồi hộp, đánh trống ngực, tim đập nhanh, tim đập chậm, tim đập không đều, loạn nhịp tim
- huyết áp cao, tăng huyết áp, huyết áp thấp, tụt huyết áp, choáng váng khi đứng dậy
- khó thở khi gắng sức, khó thở khi nằm, phải kê gối cao để ngủ, thở dốc khi leo cầu thang
- phù chân, phù mắt cá chân, mệt khi vận động, ngất, xỉu
- suy tim, bệnh mạch vành, hở van tim, mỡ máu cao, cholesterol cao, giãn tĩnh mạch chân
- kiểm tra tim định kỳ, đo điện tim, siêu âm tim, tiền sử gia đình bệnh tim

## Da liễu
- nổi mẩn đỏ, ngứa da, mề đay, dị ứng da, phát ban, da khô bong tróc, nứt nẻ
- mụn trứng cá, mụn bọc, mụn đầu đen, da nhờn, lỗ chân lông to, sẹo rỗ, sẹo lồi
- viêm da cơ địa, chàm, vảy nến, ghẻ, chốc lở, mụn cóc, mụn rộp, zona
- nấm da, lang ben, hắc lào, nấm kẽ chân, nước ăn chân, nấm móng, móng tay biến dạng
- rụng tóc, rụng tóc từng mảng, gàu, ngứa da đầu
- nám da, tàn nhang, sạm da, đồi mồi, bạch biến, đốm trắng trên da, mảng da mất sắc tố
- nốt ruồi thay đổi, bỏng nắng, ra nhiều mồ hôi

## Tai mũi họng
- đau họng, rát họng, viêm họng, khàn tiếng, mất tiếng, nuốt đau, nuốt vướng, viêm amidan
- nghẹt mũi, ngạt mũi, sổ mũi, chảy nước mũi, hắt hơi liên tục, viêm mũi dị ứng, polyp mũi
- viêm xoang, đau nhức vùng trán, đau nhức hai bên má, chảy dịch mũi xuống họng
- chảy máu cam, chảy máu mũi
- ù tai, tiếng ve kêu trong tai, nghe kém, đau tai, chảy mủ tai, viêm tai giữa, ráy tai
- ngủ ngáy, ngưng thở khi ngủ, hóc xương cá, dị vật tai mũi họng, chóng mặt do tai trong

## Thần kinh
- đau đầu, đau nửa đầu, đau đầu sau gáy, đau đầu do căng thẳng
- chóng mặt, quay cuồng, mất thăng bằng, rối loạn tiền đình
- mất ngủ, khó ngủ, ngủ không sâu, trằn trọc, thức giấc giữa đêm
- hay quên, suy giảm trí nhớ, sa sút trí tuệ, lo âu, căng thẳng kéo dài
- run tay, cử động chậm, bệnh Parkinson, giật cơ
- tê tay chân, tê bì, cảm giác kiến bò, yếu tay chân, mất cảm giác, đau dây thần kinh
- co giật, động kinh, liệt mặt, di chứng tai biến mạch máu não

## Nhi khoa
- trẻ em, trẻ nhỏ, trẻ sơ sinh, em bé, bé, con tôi, tháng tuổi, tuổi
- sốt ở trẻ, quấy khóc, bỏ bú, biếng ăn, chậm tăng cân, suy dinh dưỡng, chậm lớn, còi xương
- chậm nói, chậm đi, ra mồ hôi trộm, đái dầm
- ho ở trẻ, khò khè ở trẻ, sổ mũi ở trẻ
- tiêu chảy ở trẻ, nôn trớ, táo bón ở trẻ, đau bụng ở trẻ, giun sán, dị ứng sữa
- vàng da sơ sinh, rôm sảy, hăm tã, bệnh chân tay miệng, thủy đậu, sởi, quai bị
- tiêm chủng, khám sức khỏe định kỳ cho trẻ

## Hô hấp
- ho kéo dài, ho có đờm, ho khan lâu ngày, ho ra đờm xanh, ho ra đờm vàng
- khó thở, hụt hơi, thở khò khè, tức ngực khi thở, đau ngực khi hít sâu
- viêm phổi, viêm phế quản, giãn phế quản, hen suyễn, cơn hen
- bệnh phổi tắc nghẽn mạn tính, COPD, hút thuốc lá lâu năm
- lao phổi, ra mồ hôi đêm, sốt về chiều, tràn dịch màng phổi, nốt mờ ở phổi
- khó thở khi trời lạnh, đo chức năng hô hấp, chụp X-quang phổi

## Tiêu hóa
- đau bụng, đau dạ dày, đau thượng vị, đau vùng trên rốn, đau bụng khi đói
- ợ chua, ợ hơi, nóng rát sau xương ức, trào ngược dạ dày thực quản, khó nuốt
- buồn nôn, nôn, đầy bụng, chướng hơi, khó tiêu, chán ăn
- tiêu chảy, đi ngoài phân lỏng, táo bón, hội chứng ruột kích thích, viêm đại tràng
- đi ngoài ra máu, trĩ, rát hậu môn, ngộ độc thực phẩm
- vàng da, vàng mắt, nước tiểu sẫm màu, viêm gan, men gan cao, gan nhiễm mỡ, sỏi mật
- nội soi dạ dày, nội soi đại tràng

## Cơ xương khớp
- đau lưng, đau thắt lưng, đau cột sống, thoát vị đĩa đệm, gai cột sống
- đau thần kinh tọa, đau lan xuống mông và chân
- đau cổ, đau vai gáy, cứng cổ, đau vai, đau cổ tay, hội chứng ống cổ tay, đau gót chân
- đau khớp gối, khớp kêu khi cử động, thoái hóa khớp, viêm khớp, viêm khớp dạng thấp
- cứng khớp buổi sáng, sưng khớp, bệnh gút, axit uric cao, sưng đau ngón chân cái
- loãng xương, trật khớp, bong gân, trẹo chân, chấn thương thể thao
- tê bì tay chân, chuột rút, đau cơ, đau mỏi người

## Phụ sản
- kinh nguyệt không đều, rối loạn kinh nguyệt, chậm kinh, trễ kinh, mất kinh, rong kinh
- đau bụng kinh, đau bụng dưới, ra máu bất thường
- khí hư bất thường, huyết trắng, ngứa vùng kín, viêm âm đạo, nấm âm đạo, viêm phụ khoa
- mang thai, có thai, khám thai, siêu âm thai, thai kỳ, ốm nghén, que thử thai, sau sinh
- vô sinh, hiếm muộn, khó có con
- kế hoạch hóa gia đình, tránh thai, đặt vòng
- u xơ tử cung, u nang buồng trứng, buồng trứng đa nang, tiền mãn kinh, mãn kinh, bốc hỏa
- khám phụ khoa định kỳ, tầm soát ung thư cổ tử cung

## Ung Thư
- khối u, cục u bất thường, sờ thấy cục cứng, u vú, khối u lớn dần
- hạch to, nổi hạch kéo dài, hạch cứng không đau
- sụt cân không rõ nguyên nhân, mệt mỏi kéo dài, chán ăn kéo dài, sốt kéo dài không rõ nguyên nhân
- nuốt nghẹn tăng dần, khàn tiếng kéo dài, thay đổi thói quen đi ngoài kéo dài
- nốt ruồi thay đổi hình dạng, nốt ruồi lớn nhanh, vết loét lâu lành
- tầm soát ung thư, tiền sử gia đình ung thư, chỉ số ung thư cao
- hóa trị, xạ trị, theo dõi và tái khám sau điều trị ung thư
