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
			await router.push("/dashboard");
		} catch (error: any) {
			toast({ title: text.errorTitle, status: "error", description: error?.response?.data?.err || error?.message || text.submitError, isClosable: true });
		} finally {
			actions.setSubmitting(false);
		}
	};

	return (
		<Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={schema} validateOnBlur>
			{(formik) => (
				<form onSubmit={formik.handleSubmit}>
					<Modal isOpen={formik.isSubmitting} closeOnOverlayClick={false} closeOnEsc={false} onClose={() => {}}>
						<ModalOverlay />
						<ModalContent p="10"><ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center">
							<CircularProgress size="150px" value={uploadProgress}><CircularProgressLabel>{Math.round(uploadProgress)}%</CircularProgressLabel></CircularProgress>
							<Heading mt="4" fontSize="lg">{text.uploading}</Heading>
						</ModalBody></ModalContent>
					</Modal>

					<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5" mb="5">
						<InputField formik={formik} label={text.title} name="title" />
						<FormControl><FormLabel>{text.spaceType}</FormLabel><Select name="spaceType" value={formik.values.spaceType} onChange={formik.handleChange} variant="filled">
							<option value="SHOP">{text.spaceTypes.SHOP}</option><option value="OFFICE">{text.spaceTypes.OFFICE}</option><option value="WAREHOUSE">{text.spaceTypes.WAREHOUSE}</option><option value="MARKET_STALL">{text.spaceTypes.MARKET_STALL}</option><option value="WORKSHOP">{text.spaceTypes.WORKSHOP}</option><option value="LAND">{text.spaceTypes.LAND}</option>
						</Select></FormControl>
					</SimpleGrid>

					<SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing="5" mb="5">
						<FormControl><FormLabel>{text.rentOrSale}</FormLabel><Select name="type" value={formik.values.type} onChange={(event) => {
							formik.handleChange(event);
							if (event.target.value === "FORSALE") formik.setFieldValue("priceFrequency", "");
							else if (!formik.values.priceFrequency) formik.setFieldValue("priceFrequency", "MONTHLY");
						}} variant="filled"><option value="RENT">{text.rent}</option><option value="FORSALE">{text.sale}</option></Select></FormControl>
						<FormControl><FormLabel>{text.priceType}</FormLabel><Select name="priceType" value={formik.values.priceType} onChange={formik.handleChange} variant="filled"><option value="FIXED">{text.fixed}</option><option value="NEGOTIABLE">{text.negotiable}</option></Select></FormControl>
						<InputField formik={formik} label={text.price} name="price" type="number" suffix={<Text>ETB</Text>} />
						{formik.values.type === "RENT" && <FormControl><FormLabel>{text.priceFrequency}</FormLabel><Select name="priceFrequency" value={formik.values.priceFrequency} onChange={formik.handleChange} variant="filled"><option value="DAILY">{text.frequencies.DAILY}</option><option value="WEEKLY">{text.frequencies.WEEKLY}</option><option value="MONTHLY">{text.frequencies.MONTHLY}</option><option value="YEARLY">{text.frequencies.YEARLY}</option></Select></FormControl>}
					</SimpleGrid>

					<SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing="5" mb="5">
						<InputField formik={formik} label={text.floorArea} name="area" type="number" suffix={<Text>m²</Text>} />
						<InputField formik={formik} label={text.region} name="region" />
						<InputField formik={formik} label={text.city} name="city" />
						<InputField formik={formik} label={text.subcity} name="subcity" />
						<InputField formik={formik} label={text.woreda} name="woreda" />
						<InputField formik={formik} label={text.neighborhood} name="neighborhood" />
						<InputField formik={formik} label={text.landmark} name="landmark" />
					</SimpleGrid>

					<FormControl mb="5"><FormLabel>{text.facilities}</FormLabel><Flex gap={{ base: 3, md: 6 }} wrap="wrap">
						<Checkbox name="electricity" isChecked={formik.values.electricity} onChange={formik.handleChange}>{text.electricity}</Checkbox>
						<Checkbox name="water" isChecked={formik.values.water} onChange={formik.handleChange}>{text.water}</Checkbox>
						<Checkbox name="roadAccess" isChecked={formik.values.roadAccess} onChange={formik.handleChange}>{text.roadAccess}</Checkbox>
						<Checkbox name="parking" isChecked={formik.values.parking} onChange={formik.handleChange}>{text.parking}</Checkbox>
					</Flex></FormControl>

					<FormControl mb="5"><FormLabel>{text.description}</FormLabel><Textarea name="description" value={formik.values.description} onChange={formik.handleChange} variant="filled" maxLength={10000} /></FormControl>
					<FormControl><FormLabel>{text.photos}</FormLabel><Input type="file" name="files" accept="image/jpeg,image/png,image/webp,image/gif" multiple variant="filled" onChange={(event) => formik.setFieldValue("files", Array.from(event.currentTarget.files || []))} />
						{formik.touched.files && formik.errors.files && <Text mt="2" color="red.500" fontSize="sm">{text.photosRequired}</Text>}
					</FormControl>
					<Grid gridTemplateColumns="repeat(auto-fit, 160px)" gap="4" my="4">
						{formik.values.files.map((file, index) => <Image alt={`${text.photoPreview} ${index + 1}`} key={`${file.name}-${index}`} borderRadius="lg" width="160px" height="160px" objectFit="cover" src={URL.createObjectURL(file)} />)}
					</Grid>
					<Flex justify="flex-end" gap="3" mt="5">
						<Button type="submit" colorScheme="orange" leftIcon={<MdSave />} isLoading={formik.isSubmitting} isDisabled={!formik.isValid}>{text.submit}</Button>
						<Button type="button" leftIcon={<MdClose />} onClick={() => router.push("/dashboard")}>{text.cancel}</Button>
					</Flex>
				</form>
			)}
		</Formik>
	);
};
