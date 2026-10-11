import {
	Button,
	Checkbox,
	CircularProgress,
	CircularProgressLabel,
	Flex,
	FormControl,
	FormLabel,
	Grid,
	Heading,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalOverlay,
	Select,
	SimpleGrid,
	Text,
	Textarea,
	useToast,
	useColorModeValue,
} from "@chakra-ui/react";
import { InputField } from "@components/dashboard/forms/InputField";
import { useLang } from "@libs/hooks/useLang";
import axios from "axios";
import { Formik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";
import { MdClose, MdSave } from "react-icons/md";
import * as yup from "yup";

const schema = yup.object().shape({
	title: yup.string().min(5).max(300).required(),
	price: yup.number().min(0).required(),
	priceType: yup.string().oneOf(["FIXED", "NEGOTIABLE"]).required(),
	type: yup.string().oneOf(["RENT", "FORSALE"]).required(),
	priceFrequency: yup.string().when("type", {
		is: "RENT",
		then: (value) => value.oneOf(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).required(),
		otherwise: (value) => value.notRequired(),
	}),
	spaceType: yup.string().oneOf(["SHOP", "OFFICE", "WAREHOUSE", "MARKET_STALL", "WORKSHOP", "LAND"]).required(),
	area: yup.number().min(1).required(),
	region: yup.string().trim().required(),
	city: yup.string().trim().required(),
	files: yup.array().min(1),
});

export const AddBusinessSpace = () => {
	const router = useRouter();
	const toast = useToast();
	const text = useLang().businessListing;
	const uploadButtonBg = useColorModeValue("orange.50", "whiteAlpha.100");
	const uploadButtonText = useColorModeValue("orange.800", "orange.100");
	const [uploadProgress, setUploadProgress] = useState(0);

	const initialValues = {
		title: "",
		description: "",
		price: 0,
		priceType: "NEGOTIABLE",
		itemType: "BUSINESS_SPACE",
		files: [],
		type: "RENT",
		priceFrequency: "MONTHLY",
		spaceType: "SHOP",
		area: 0,
		region: "",
		city: "",
		subcity: "",
		woreda: "",
		neighborhood: "",
		landmark: "",
		electricity: false,
		water: false,
		roadAccess: false,
		parking: false,
	};

	const onSubmit = async (values, actions) => {
		const formData = new FormData();
		const { files, ...fields } = values;
		Object.entries(fields).forEach(([key, value]) => formData.append(key, String(value)));
		files.forEach((file) => formData.append("files", file));

		try {
			const response = await axios.post("/api/items/add", formData, {
				headers: { "Content-Type": "multipart/form-data" },
				onUploadProgress: (event) => {
					if (event.total) setUploadProgress((event.loaded * 100) / event.total);
				},
			});
			toast({ title: text.successTitle, status: "success", description: response.data.msg, isClosable: true });
			await router.push(`/items/${response.data.itemId}`);
		} catch (error: any) {
			toast({ title: text.errorTitle, status: "error", description: error?.response?.data?.err || error?.message || text.submitError, isClosable: true });
		} finally {
			actions.setSubmitting(false);
		}
	};

	return (
		<Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={schema} validateOnBlur>
			{(formik) => (
				<form onSubmit={formik.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
					<Modal isOpen={formik.isSubmitting} closeOnOverlayClick={false} closeOnEsc={false} onClose={() => {}}>
						<ModalOverlay />
						<ModalContent p="10"><ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center">
							<CircularProgress size="150px" value={uploadProgress}><CircularProgressLabel>{Math.round(uploadProgress)}%</CircularProgressLabel></CircularProgress>
							<Heading mt="4" fontSize="lg">{text.uploading}</Heading>
						</ModalBody></ModalContent>
					</Modal>

					<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
						<InputField formik={formik} label={text.title} name="title" />
						<FormControl><FormLabel htmlFor="spaceType">{text.spaceType}</FormLabel><Select id="spaceType" name="spaceType" value={formik.values.spaceType} onChange={formik.handleChange} variant="filled">
							<option value="SHOP">{text.spaceTypes.SHOP}</option><option value="OFFICE">{text.spaceTypes.OFFICE}</option><option value="WAREHOUSE">{text.spaceTypes.WAREHOUSE}</option><option value="MARKET_STALL">{text.spaceTypes.MARKET_STALL}</option><option value="WORKSHOP">{text.spaceTypes.WORKSHOP}</option><option value="LAND">{text.spaceTypes.LAND}</option>
						</Select></FormControl>
					</SimpleGrid>

					<SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing="5">
						<FormControl><FormLabel htmlFor="type">{text.rentOrSale}</FormLabel><Select id="type" name="type" value={formik.values.type} onChange={(event) => {
							formik.handleChange(event);
							if (event.target.value === "FORSALE") formik.setFieldValue("priceFrequency", "");
							else if (!formik.values.priceFrequency) formik.setFieldValue("priceFrequency", "MONTHLY");
						}} variant="filled"><option value="RENT">{text.rent}</option><option value="FORSALE">{text.sale}</option></Select></FormControl>
						<FormControl><FormLabel htmlFor="priceType">{text.priceType}</FormLabel><Select id="priceType" name="priceType" value={formik.values.priceType} onChange={formik.handleChange} variant="filled"><option value="FIXED">{text.fixed}</option><option value="NEGOTIABLE">{text.negotiable}</option></Select></FormControl>
						<InputField formik={formik} label={text.price} name="price" type="number" suffix={<Text>ETB</Text>} />
						{formik.values.type === "RENT" && <FormControl><FormLabel htmlFor="priceFrequency">{text.priceFrequency}</FormLabel><Select id="priceFrequency" name="priceFrequency" value={formik.values.priceFrequency} onChange={formik.handleChange} variant="filled"><option value="DAILY">{text.frequencies.DAILY}</option><option value="WEEKLY">{text.frequencies.WEEKLY}</option><option value="MONTHLY">{text.frequencies.MONTHLY}</option><option value="YEARLY">{text.frequencies.YEARLY}</option></Select></FormControl>}
					</SimpleGrid>

					<SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing="5">
						<InputField formik={formik} label={text.floorArea} name="area" type="number" suffix={<Text>m²</Text>} />
						<InputField formik={formik} label={text.region} name="region" />
						<InputField formik={formik} label={text.city} name="city" />
						<InputField formik={formik} label={text.subcity} name="subcity" />
						<InputField formik={formik} label={text.woreda} name="woreda" />
						<InputField formik={formik} label={text.neighborhood} name="neighborhood" />
						<InputField formik={formik} label={text.landmark} name="landmark" />
					</SimpleGrid>

					<FormControl><FormLabel>{text.facilities}</FormLabel><Flex gap={{ base: 3, md: 6 }} wrap="wrap">
						<Checkbox name="electricity" isChecked={formik.values.electricity} onChange={formik.handleChange}>{text.electricity}</Checkbox>
						<Checkbox name="water" isChecked={formik.values.water} onChange={formik.handleChange}>{text.water}</Checkbox>
						<Checkbox name="roadAccess" isChecked={formik.values.roadAccess} onChange={formik.handleChange}>{text.roadAccess}</Checkbox>
						<Checkbox name="parking" isChecked={formik.values.parking} onChange={formik.handleChange}>{text.parking}</Checkbox>
					</Flex></FormControl>

					<FormControl><FormLabel htmlFor="description">{text.description}</FormLabel><Textarea id="description" name="description" value={formik.values.description} onChange={formik.handleChange} placeholder={text.description} variant="filled" maxLength={10000} /></FormControl>
					<FormControl><FormLabel htmlFor="business-photos">{text.photos}</FormLabel><Input id="business-photos" type="file" name="files" accept="image/jpeg,image/png,image/webp,image/gif" multiple variant="filled" h="auto" minH="12" py="2" sx={{ "&::file-selector-button": { mr: 3, px: 3, py: 2, border: 0, borderRadius: "md", bg: uploadButtonBg, color: uploadButtonText, fontWeight: 600, cursor: "pointer" } }} onChange={(event) => formik.setFieldValue("files", Array.from(event.currentTarget.files || []))} />
						{formik.touched.files && formik.errors.files && <Text mt="2" color="red.500" fontSize="sm">{text.photosRequired}</Text>}
					</FormControl>
					<Grid gridTemplateColumns="repeat(auto-fit, 160px)" gap="4">
						{formik.values.files.map((file, index) => <Image alt={`${text.photoPreview} ${index + 1}`} key={`${file.name}-${index}`} borderRadius="lg" width="160px" height="160px" objectFit="cover" src={URL.createObjectURL(file)} />)}
					</Grid>
					<Flex justify={{ base: "stretch", sm: "flex-end" }} direction={{ base: "column-reverse", sm: "row" }} gap="3">
						<Button type="submit" w={{ base: "full", sm: "auto" }} colorScheme="orange" leftIcon={<MdSave />} isLoading={formik.isSubmitting} isDisabled={!formik.isValid}>{text.submit}</Button>
						<Button type="button" w={{ base: "full", sm: "auto" }} leftIcon={<MdClose />} onClick={() => router.push("/dashboard")}>{text.cancel}</Button>
					</Flex>
				</form>
			)}
		</Formik>
	);
};
